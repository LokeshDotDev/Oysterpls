import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus, ScheduleStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { triggerRazorpayXPayout } from '@/lib/razorpay';
import { generateAmortizationSchedule } from '@/lib/emi-engine';
import { logAudit } from '@/lib/audit';
import { sendNotification } from '@/lib/notification';

export const POST = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };

    // 1. Fetch Loan Application
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        product: true,
        loan: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.loan) {
      return NextResponse.json({ error: 'Loan has already been disbursed for this application' }, { status: 400 });
    }

    // Ensure application status is MANDATE_ACTIVE
    // For test simulation, let's allow APPROVED or MANDATE_ACTIVE to bypass mandate if needed,
    // but strictly enforce MANDATE_ACTIVE to maintain production logic.
    if (application.status !== LoanStatus.MANDATE_ACTIVE) {
      return NextResponse.json({
        error: `Disbursement requires an active mandate. Current application status is ${application.status}`,
      }, { status: 400 });
    }

    const profile = application.customer.profile;
    if (!profile) {
      return NextResponse.json({ error: 'Customer bank profile not found' }, { status: 400 });
    }

    const principalAmount = Number(application.requestedAmount);

    // 2. Trigger RazorpayX Payout
    const payoutResult = await triggerRazorpayXPayout(
      profile.bankAccountNo,
      profile.bankIfsc,
      profile.fullName,
      principalAmount,
      application.id
    );

    if (payoutResult.status === 'failed') {
      return NextResponse.json({ error: 'RazorpayX payout rejected or failed' }, { status: 400 });
    }

    // 3. Create Loan Record
    const loan = await prisma.loan.create({
      data: {
        applicationId: application.id,
        disbursedAmount: principalAmount,
        outstandingAmount: principalAmount,
        tenure: application.requestedTenure,
        interestRate: application.product.interestRate,
        interestType: application.product.interestType,
        status: LoanStatus.ACTIVE,
        disbursedAt: new Date(),
        razorpayPayoutId: payoutResult.payoutId,
      },
    });

    // 4. Update Loan Application Status to DISBURSED
    await prisma.loanApplication.update({
      where: { id: application.id },
      data: { status: LoanStatus.DISBURSED },
    });

    // 5. Generate Amortization Schedule
    const amortizationSchedule = generateAmortizationSchedule(
      principalAmount,
      Number(application.product.interestRate),
      application.requestedTenure,
      application.product.interestType as 'FLAT' | 'REDUCING',
      new Date() // starts today, installments start next month
    );

    // Save schedules to database
    const scheduleCreates = amortizationSchedule.map((line) =>
      prisma.eMISchedule.create({
        data: {
          loanId: loan.id,
          installmentNo: line.installmentNo,
          dueDate: line.dueDate,
          principal: line.principal,
          interest: line.interest,
          amountDue: line.amountDue,
          amountPaid: 0,
          status: ScheduleStatus.PENDING,
        },
      })
    );
    await Promise.all(scheduleCreates);

    // 6. Record Payment Transaction for disbursement
    await prisma.paymentTransaction.create({
      data: {
        loanId: loan.id,
        amount: principalAmount,
        type: TransactionType.DISBURSEMENT,
        status: TransactionStatus.SUCCESS,
        razorpayPaymentId: payoutResult.payoutId,
      },
    });

    // 7. Record System Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'LOAN_DISBURSEMENT',
      entity: 'Loan',
      entityId: loan.id,
      newValue: {
        loanId: loan.id,
        amount: principalAmount,
        payoutId: payoutResult.payoutId,
      },
      ipAddress,
    });

    // 8. Send Notification to Customer (SMS Mock)
    await sendNotification({
      userId: application.customerId,
      channel: 'SMS',
      recipient: application.customer.phoneNumber,
      content: `Disbursement Alert: An amount of ₹${principalAmount} has been disbursed to your bank account ending in ${profile.bankAccountNo.substr(-4)} via RazorpayX. Repayments start next month.`,
    });

    return NextResponse.json({
      success: true,
      loan,
    });
  } catch (error: any) {
    console.error('Disbursement processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.FINANCE, Role.ADMIN, Role.SUPER_ADMIN]);
