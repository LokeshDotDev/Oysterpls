import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus } from '@prisma/client';

// GET all loans (filtered by role)
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') as LoanStatus | null;

    let whereClause: any = {};

    if (session.role === Role.CUSTOMER) {
      whereClause.application = { customerId: session.userId };
    } else if (session.role === Role.MERCHANT) {
      whereClause.application = { merchantId: session.userId };
    } else {
      // Internal roles can view all loans
      if (statusFilter) {
        whereClause.status = statusFilter;
      }
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        application: {
          include: {
            customer: {
              select: {
                id: true,
                phoneNumber: true,
                email: true,
                profile: true,
              },
            },
            product: true,
            mandate: true,
          },
        },
        schedules: {
          orderBy: { installmentNo: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Dynamically calculate and append DPD (Days Past Due) and current overdue amounts for the list view
    const formattedLoans = loans.map((loan) => {
      const unpaidOverdueSchedules = loan.schedules.filter(
        (s) => (s.status === 'OVERDUE' || s.status === 'FAILED' || s.dueDate < new Date()) && s.amountPaid < s.amountDue
      );

      let dpd = 0;
      let totalOverdueAmount = 0;

      if (unpaidOverdueSchedules.length > 0) {
        // Oldest unpaid schedule determines DPD
        const oldestDueDate = new Date(Math.min(...unpaidOverdueSchedules.map((s) => s.dueDate.getTime())));
        const diffTime = Date.now() - oldestDueDate.getTime();
        dpd = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        
        // Sum up total outstanding due on overdue installments
        totalOverdueAmount = unpaidOverdueSchedules.reduce(
          (sum, s) => sum + (Number(s.amountDue) + Number(s.penaltyAccrued) + Number(s.lateFeeAccrued) - Number(s.amountPaid)),
          0
        );
      }

      return {
        ...loan,
        dpd,
        totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
      };
    });

    return NextResponse.json({ success: true, loans: formattedLoans });
  } catch (error: any) {
    console.error('Failed to query loans:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
