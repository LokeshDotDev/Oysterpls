import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus } from '@prisma/client';
import { evaluateEligibility } from '@/lib/eligibility-engine';
import { logAudit } from '@/lib/audit';

const applicationSchema = z.object({
  productId: z.string().min(1),
  requestedAmount: z.number().positive(),
  requestedTenure: z.number().int().positive(),
  customerId: z.string().optional(), // Required for merchants submitting on behalf of customers
  productName: z.string().optional(),
  productBrandName: z.string().optional(),
  productModelNo: z.string().optional(),
  productValue: z.number().optional(),
  productInsurance: z.number().optional(),
  downPayment: z.number().optional(),
  processingFee: z.number().optional(),
  emiAmount: z.number().optional(),
  payableToStore: z.number().optional(),
  frequency: z.string().optional(),
  status: z.nativeEnum(LoanStatus).optional(),
  onboardingStep: z.number().optional(),
});

// GET applications list (Role-restricted filters)
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') as LoanStatus | null;
    
    let whereClause: any = {};

    // Enforce role-based access limits
    if (session.role === Role.CUSTOMER) {
      whereClause.customerId = session.userId;
    } else if (session.role === Role.MERCHANT) {
      whereClause.merchantId = session.userId;
    } else {
      // Internal roles can view all applications, optionally filtering by status
      if (statusFilter) {
        whereClause.status = statusFilter;
      }
    }

    const applications = await prisma.loanApplication.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            profile: {
              include: {
                documents: true,
              },
            },
          },
        },
        merchant: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                shopName: true,
              },
            },
          },
        },
        product: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        loan: {
          include: {
            schedules: { orderBy: { installmentNo: 'asc' } },
            transactions: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Failed to query applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

// POST submit a new loan application
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = applicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const { productId, requestedAmount, requestedTenure, customerId } = data;

    // Determine target customer
    let targetCustomerId = session.userId;
    let merchantId: string | null = null;

    if (session.role === Role.MERCHANT) {
      if (!customerId) {
        return NextResponse.json({ error: 'Merchant must specify a customerId' }, { status: 400 });
      }
      targetCustomerId = customerId;
      merchantId = session.userId;
    }

    // Fetch customer profile
    const profile = await prisma.profile.findUnique({
      where: { userId: targetCustomerId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Customer profile must be completed before applying for a loan' }, { status: 400 });
    }

    // Fetch loan product
    const product = await prisma.loanProduct.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Selected loan product is invalid or inactive' }, { status: 400 });
    }

    // Evaluate eligibility engine rules
    const eligibility = await evaluateEligibility(
      profile,
      product,
      requestedAmount,
      requestedTenure
    );

    // Initial status: DRAFT or SUBMITTED/UNDER_REVIEW
    const initialStatus: LoanStatus = data.status || LoanStatus.UNDER_REVIEW;
    const onboardingStep = data.onboardingStep || 1;

    // Create loan application in DB
    const application = await prisma.loanApplication.create({
      data: {
        customerId: targetCustomerId,
        merchantId,
        productId,
        requestedAmount,
        requestedTenure,
        status: initialStatus,
        onboardingStep,
        eligibilityCheck: eligibility as any,
        productName: data.productName,
        productBrandName: data.productBrandName,
        productModelNo: data.productModelNo,
        productValue: data.productValue,
        productInsurance: data.productInsurance,
        downPayment: data.downPayment,
        processingFee: data.processingFee,
        emiAmount: data.emiAmount,
        payableToStore: data.payableToStore,
        frequency: data.frequency || 'MONTHLY',
        deliveryOrderStatus: 'IN_PROCESS', // Initial delivery order status
      },
      include: {
        customer: {
          select: {
            phoneNumber: true,
            email: true,
            profile: true,
          },
        },
        product: true,
      },
    });

    // Record System Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'SUBMIT_LOAN_APPLICATION',
      entity: 'LoanApplication',
      entityId: application.id,
      newValue: {
        id: application.id,
        customerId: targetCustomerId,
        merchantId,
        requestedAmount,
        requestedTenure,
        status: initialStatus,
        eligible: eligibility.eligible,
        riskFlags: eligibility.riskFlags,
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.CUSTOMER, Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
