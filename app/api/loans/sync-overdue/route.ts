import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus, ScheduleStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { calculateOverdueCharges } from '@/lib/emi-engine';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const today = new Date();

    // Fetch all active or overdue loans with their pending installments
    const loans = await prisma.loan.findMany({
      where: {
        status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
      },
      include: {
        schedules: {
          where: {
            dueDate: { lt: today },
            status: { not: ScheduleStatus.PAID },
          },
        },
        application: {
          include: {
            product: true,
          },
        },
      },
    });

    let updatedLoansCount = 0;
    let totalAccruedLateFees = 0;
    let totalAccruedPenalties = 0;

    for (const loan of loans) {
      if (loan.schedules.length === 0) continue;

      let loanUpdated = false;
      let loanLateFeeIncrease = 0;
      let loanPenaltyIncrease = 0;

      for (const schedule of loan.schedules) {
        // Calculate failed debit attempts from payment transactions for this loan
        // matching this installment period (simplification: count failed repayments since due date)
        const failedRepaymentsCount = await prisma.paymentTransaction.count({
          where: {
            loanId: loan.id,
            type: TransactionType.EMI_REPAYMENT,
            status: TransactionStatus.FAILED,
            createdAt: { gte: schedule.dueDate },
          },
        });

        // Compute late fees & bounce charges
        const { penalty, lateFee } = calculateOverdueCharges(
          schedule.dueDate,
          Number(schedule.amountDue),
          Number(schedule.amountPaid),
          Number(loan.application.product.lateFeeRate) * 12, // Convert monthly rate to annual
          Number(loan.application.product.bounceCharge),
          failedRepaymentsCount
        );

        const newPenaltyAccrued = penalty;
        const newLateFeeAccrued = lateFee;

        const penaltyDiff = newPenaltyAccrued - Number(schedule.penaltyAccrued);
        const lateFeeDiff = newLateFeeAccrued - Number(schedule.lateFeeAccrued);

        if (penaltyDiff > 0 || lateFeeDiff > 0 || schedule.status !== ScheduleStatus.OVERDUE) {
          loanLateFeeIncrease += lateFeeDiff;
          loanPenaltyIncrease += penaltyDiff;

          // Update EMISchedule row
          await prisma.eMISchedule.update({
            where: { id: schedule.id },
            data: {
              status: ScheduleStatus.OVERDUE,
              penaltyAccrued: newPenaltyAccrued,
              lateFeeAccrued: newLateFeeAccrued,
              // Adjust amount due by the differences
              amountDue: Number(schedule.amountDue) + penaltyDiff + lateFeeDiff,
            },
          });

          loanUpdated = true;
        }
      }

      if (loanUpdated || loan.status !== LoanStatus.OVERDUE) {
        const totalIncrease = loanLateFeeIncrease + loanPenaltyIncrease;
        
        // Update Loan outstanding balance and status
        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: LoanStatus.OVERDUE,
            outstandingAmount: Number(loan.outstandingAmount) + totalIncrease,
          },
        });

        updatedLoansCount++;
        totalAccruedLateFees += loanLateFeeIncrease;
        totalAccruedPenalties += loanPenaltyIncrease;

        // Record Audit log for loan status update
        await logAudit({
          action: 'SYNC_LOAN_OVERDUE',
          entity: 'Loan',
          entityId: loan.id,
          newValue: {
            status: LoanStatus.OVERDUE,
            outstandingAmountIncrease: totalIncrease,
            lateFeeIncrease: loanLateFeeIncrease,
            penaltyIncrease: loanPenaltyIncrease,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully checked portfolio. Updated ${updatedLoansCount} loans.`,
      stats: {
        updatedLoansCount,
        totalAccruedLateFees,
        totalAccruedPenalties,
      },
    });
  } catch (error: any) {
    console.error('Failed to sync overdue portfolio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.COLLECTIONS, Role.ADMIN, Role.SUPER_ADMIN]);
