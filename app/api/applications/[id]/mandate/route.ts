import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus } from '@prisma/client';
import { createRazorpayCustomer, setupRazorpayMandate } from '@/lib/razorpay';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };

    // Fetch the application
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Loan application not found' }, { status: 404 });
    }

    // Access control: Only the customer themselves or their merchant can set up the mandate
    if (session.role === Role.CUSTOMER && application.customerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.role === Role.MERCHANT && application.merchantId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure status is APPROVED (or MANDATE_PENDING if retrying)
    if (application.status !== LoanStatus.APPROVED && application.status !== LoanStatus.MANDATE_PENDING) {
      return NextResponse.json({
        error: `Mandate can only be set up for APPROVED loans. Current status is ${application.status}`,
      }, { status: 400 });
    }

    const customerProfile = application.customer.profile;
    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 400 });
    }

    // Generate Razorpay customer
    const rzpCustomerId = await createRazorpayCustomer(
      customerProfile.fullName,
      application.customer.email || 'customer@lending.com',
      application.customer.phoneNumber
    );

    // Setup Mandate in Razorpay
    const requestedAmount = Number(application.requestedAmount);
    const { mandateId, authUrl } = await setupRazorpayMandate(
      application.id,
      rzpCustomerId,
      requestedAmount
    );

    // Upsert Mandate row in DB
    const mandate = await prisma.mandate.upsert({
      where: { applicationId: application.id },
      update: {
        razorpayMandateId: mandateId,
        status: 'PENDING',
        authUrl,
      },
      create: {
        applicationId: application.id,
        razorpayMandateId: mandateId,
        status: 'PENDING',
        authUrl,
      },
    });

    // Update LoanApplication status to MANDATE_PENDING
    await prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: LoanStatus.MANDATE_PENDING,
      },
    });

    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'SETUP_MANDATE',
      entity: 'LoanApplication',
      entityId: application.id,
      newValue: {
        mandateId,
        status: 'PENDING',
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      authUrl,
      mandate,
    });
  } catch (error: any) {
    console.error('Error creating mandate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.CUSTOMER, Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
