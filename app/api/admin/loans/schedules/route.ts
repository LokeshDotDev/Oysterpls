import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus, ScheduleStatus } from '@prisma/client';
import { logAudit } from '@/lib/audit';

export const PATCH = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const { scheduleId, status, amountPaid, penaltyAccrued, lateFeeAccrued, amountDue, paidAt } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 });
    }

    // Find the schedule
    const schedule = await prisma.eMISchedule.findUnique({
      where: { id: scheduleId },
      include: {
        loan: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'EMI schedule not found' }, { status: 404 });
    }

    // Determine target status
    let finalStatus = status as ScheduleStatus | undefined;
    
    // Automatically set status to PAID if amountPaid matches amountDue
    if (amountPaid !== undefined && amountDue !== undefined && finalStatus === undefined) {
      if (Number(amountPaid) >= Number(amountDue)) {
        finalStatus = ScheduleStatus.PAID;
      }
    }

    // Update schedule
    const updatedSchedule = await prisma.eMISchedule.update({
      where: { id: scheduleId },
      data: {
        ...(finalStatus !== undefined && { status: finalStatus }),
        ...(amountPaid !== undefined && { amountPaid }),
        ...(penaltyAccrued !== undefined && { penaltyAccrued }),
        ...(lateFeeAccrued !== undefined && { lateFeeAccrued }),
        ...(amountDue !== undefined && { amountDue }),
        ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : (finalStatus === ScheduleStatus.PAID ? new Date() : null) }),
      },
    });

    // Fetch all schedules for this loan to recalculate metrics
    const allSchedules = await prisma.eMISchedule.findMany({
      where: { loanId: schedule.loanId },
    });

    const newOutstanding = allSchedules.reduce((sum, s) => {
      const due = Number(s.amountDue);
      const paid = Number(s.amountPaid);
      return sum + Math.max(0, due - paid);
    }, 0);

    const principalPaid = allSchedules
      .filter((s) => s.status === ScheduleStatus.PAID)
      .reduce((sum, s) => sum + Number(s.principal), 0);

    const interestPaid = allSchedules
      .filter((s) => s.status === ScheduleStatus.PAID)
      .reduce((sum, s) => sum + Number(s.interest), 0);

    const penaltiesPaid = allSchedules
      .filter((s) => s.status === ScheduleStatus.PAID)
      .reduce((sum, s) => sum + Number(s.penaltyAccrued) + Number(s.lateFeeAccrued), 0);

    const isFullyPaid = newOutstanding === 0;
    const loanStatus = isFullyPaid 
      ? LoanStatus.CLOSED 
      : allSchedules.some((s) => s.status === ScheduleStatus.OVERDUE) 
        ? LoanStatus.OVERDUE 
        : LoanStatus.ACTIVE;

    // Update Loan record
    await prisma.loan.update({
      where: { id: schedule.loanId },
      data: {
        outstandingAmount: newOutstanding,
        principalPaid,
        interestPaid,
        penaltiesPaid,
        status: loanStatus,
        closedAt: isFullyPaid ? new Date() : null,
      },
    });

    // If fully paid, also close the application
    if (isFullyPaid) {
      await prisma.loanApplication.update({
        where: { id: schedule.loan.applicationId },
        data: { status: LoanStatus.CLOSED },
      });
    }

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'ADMIN_EDIT_EMI_SCHEDULE',
      entity: 'EMISchedule',
      entityId: scheduleId,
      newValue: { status: finalStatus, amountPaid, penaltyAccrued, lateFeeAccrued, amountDue },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
    });
  } catch (error: any) {
    console.error('Error in manual EMI edit API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS, Role.FINANCE, Role.COLLECTIONS]);
