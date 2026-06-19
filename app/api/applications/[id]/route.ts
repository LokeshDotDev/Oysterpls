import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { sendNotification } from '@/lib/notification';
import { evaluateEligibility } from '@/lib/eligibility-engine';

const statusTransitionSchema = z.object({
  status: z.nativeEnum(LoanStatus).optional(),
  remarks: z.string().optional(),
  invoiceNo: z.string().optional(),
  invoiceCost: z.number().optional(),
  imeiNumber: z.string().optional(),
  productSerialNo: z.string().optional(),
  deliveryOrderStatus: z.string().optional(),
  invoiceUploaded: z.boolean().optional(),
  onboardingStep: z.number().optional(),
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
});

// GET single application detail
export const GET = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };

    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            profile: {
              include: {
                documents: {
                  orderBy: { updatedAt: 'desc' },
                },
              },
            },
          },
        },
        product: true,
        notes: {
          include: {
            author: {
              select: {
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        mandate: true,
        loan: {
          include: {
            schedules: { orderBy: { installmentNo: 'asc' } },
            transactions: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Access control: Customers/Merchants can only view their own applications
    if (session.role === Role.CUSTOMER && application.customerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.role === Role.MERCHANT && application.merchantId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Error fetching application detail:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

// PUT transition application status (Underwriting / Ops workflow)
export const PUT = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };
    const body = await req.json();
    const result = statusTransitionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { 
      status, remarks, invoiceNo, invoiceCost, imeiNumber, productSerialNo, 
      deliveryOrderStatus, invoiceUploaded, onboardingStep, productName, 
      productBrandName, productModelNo, productValue, productInsurance, 
      downPayment, processingFee, emiAmount, payableToStore, frequency 
    } = result.data;

    // Fetch existing application
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Role check and allowed state transitions
    const current = application.status;
    
    // Quick validation of state machine transitions
    let isAllowed = false;

    // If merchant is uploading invoices, allow it without changing status, or when moving to UNDER_REVIEW
    if (session.role === Role.MERCHANT && application.merchantId === session.userId) {
      if (current === LoanStatus.UNDER_REVIEW && onboardingStep !== undefined && onboardingStep >= 5) {
        isAllowed = false;
      } else {
        isAllowed = true;
      }
    } else if (session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN) {
      isAllowed = true; // Admin overrides
    } else if (session.role === Role.OPERATIONS) {
      // Operations can check documents and transition to under review or request additional docs
      if (
        (current === LoanStatus.DRAFT && status === LoanStatus.SUBMITTED) ||
        (current === LoanStatus.SUBMITTED && (status === LoanStatus.UNDER_REVIEW || status === LoanStatus.DOCUMENT_PENDING)) ||
        (current === LoanStatus.DOCUMENT_PENDING && status === LoanStatus.UNDER_REVIEW)
      ) {
        isAllowed = true;
      }
    } else if (session.role === Role.LOAN_OFFICER) {
      // Loan Officers review and approve/reject or request more docs
      if (
        (current === LoanStatus.UNDER_REVIEW && (status === LoanStatus.APPROVED || status === LoanStatus.REJECTED || status === LoanStatus.DOCUMENT_PENDING)) ||
        (current === LoanStatus.DOCUMENT_PENDING && status === LoanStatus.UNDER_REVIEW)
      ) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json({
        error: `Insufficient privileges to transition loan from ${current} to ${status || 'current status'}`,
      }, { status: 403 });
    }

    // Evaluate eligibility if transitioning to step 5
    let eligibilityCheck: any = undefined;
    if (onboardingStep === 5) {
      const profile = await prisma.profile.findUnique({
        where: { userId: application.customerId },
      });
      const product = await prisma.loanProduct.findUnique({
        where: { id: application.productId },
      });
      if (profile && product) {
        eligibilityCheck = await evaluateEligibility(
          profile,
          product,
          Number(application.requestedAmount),
          application.requestedTenure
        );
      }
    }

    // Update application fields
    const updatedApplication = await prisma.loanApplication.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(onboardingStep !== undefined && { onboardingStep }),
        ...(eligibilityCheck !== undefined && { eligibilityCheck: eligibilityCheck as any }),
        ...(productName !== undefined && { productName }),
        ...(productBrandName !== undefined && { productBrandName }),
        ...(productModelNo !== undefined && { productModelNo }),
        ...(productValue !== undefined && { productValue }),
        ...(productInsurance !== undefined && { productInsurance }),
        ...(downPayment !== undefined && { downPayment }),
        ...(processingFee !== undefined && { processingFee }),
        ...(emiAmount !== undefined && { emiAmount }),
        ...(payableToStore !== undefined && { payableToStore }),
        ...(frequency !== undefined && { frequency }),
        ...(invoiceNo !== undefined && { invoiceNo }),
        ...(invoiceCost !== undefined && { invoiceCost }),
        ...(imeiNumber !== undefined && { imeiNumber }),
        ...(productSerialNo !== undefined && { productSerialNo }),
        ...(deliveryOrderStatus !== undefined && { deliveryOrderStatus }),
        ...(invoiceUploaded !== undefined && { invoiceUploaded }),
      },
    });

    // If remarks are provided, create an internal Note
    if (remarks) {
      await prisma.note.create({
        data: {
          applicationId: id,
          authorId: session.userId,
          content: remarks,
          isInternal: true,
        },
      });
    }

    // Record System Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: `TRANSITION_STATUS_${status}`,
      entity: 'LoanApplication',
      entityId: id,
      oldValue: { status: current },
      newValue: { status, remarks },
      ipAddress,
    });

    // Notify Customer about decision (SMS Mock)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const esignLink = `${protocol}://${host}/loan-agreement/${id}`;

    if (status) {
      const shortId = id.substring(0, 8);
      let friendlyStatus = status.toLowerCase().replace(/_/g, ' ');
      let msg = `Your loan application (ID: ${shortId}) is now ${friendlyStatus}.`;
      if (status === LoanStatus.APPROVED) {
        msg = `Congratulations! Your loan application (ID: ${shortId}) has been approved. Please log in to sign the agreement and set up your eMandate.`;
      } else if (status === LoanStatus.REJECTED) {
        msg = `Your loan application (ID: ${shortId}) was not approved. You can check the details on your dashboard.`;
      } else if (status === LoanStatus.DOCUMENT_PENDING) {
        msg = `Action required: Please review and E-Sign your digital loan agreement here: ${esignLink}`;
      } else if (status === LoanStatus.UNDER_REVIEW) {
        msg = `Your loan application (ID: ${shortId}) is currently under review by our underwriting team.`;
      } else if (status === LoanStatus.MANDATE_PENDING) {
        msg = `Action required: Please configure your bank eMandate auto-debit to proceed with your loan.`;
      } else if (status === LoanStatus.MANDATE_ACTIVE) {
        msg = `Your auto-debit mandate setup is complete and active. Disbursement is being initiated.`;
      } else if (status === LoanStatus.DISBURSED) {
        msg = `Congratulations! Your loan (ID: ${shortId}) has been successfully disbursed to your bank account.`;
      } else if (status === LoanStatus.CLOSED) {
        msg = `Your loan account has been fully closed. Thank you for using Oysterpls!`;
      }

      await sendNotification({
        userId: application.customerId,
        channel: 'SMS',
        recipient: application.customer.phoneNumber,
        content: msg,
      });

      if (status === LoanStatus.DOCUMENT_PENDING && application.customer.email) {
        const emailContent = `Dear Customer,\n\nYour loan application has been registered successfully. To proceed with the disbursement, please review and E-Sign your digital loan agreement using the secure link below:\n\n${esignLink}\n\nNote: This process requires your PAN card number and a live selfie & signature.`;
        
        await sendNotification({
          userId: application.customerId,
          channel: 'EMAIL',
          recipient: application.customer.email,
          subject: 'Action Required: E-Sign Your Digital Loan Agreement',
          content: emailContent,
        });
      }

      // Notify Merchant if one is linked to the application
      if (application.merchantId) {
        const merchantUser = await prisma.user.findUnique({
          where: { id: application.merchantId },
        });
        if (merchantUser) {
          let merchantMsg = `Application Update: Customer application (No: ORO011C2284-${id.substring(0,5)}) status is now ${friendlyStatus}.`;
          if (status === LoanStatus.APPROVED) {
            merchantMsg = `Congratulations! Customer loan application (No: ORO011C2284-${id.substring(0,5)}) has been APPROVED. Customer needs to sign agreement.`;
          } else if (status === LoanStatus.REJECTED) {
            merchantMsg = `Customer loan application (No: ORO011C2284-${id.substring(0,5)}) has been REJECTED.`;
          } else if (status === LoanStatus.DISBURSED) {
            merchantMsg = `Success! Customer loan application (No: ORO011C2284-${id.substring(0,5)}) has been DISBURSED.`;
          }
          await sendNotification({
            userId: application.merchantId,
            channel: 'SMS',
            recipient: merchantUser.phoneNumber,
            subject: 'Application Status Update',
            content: merchantMsg,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    });
  } catch (error: any) {
    console.error('Failed to transition application status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.LOAN_OFFICER, Role.OPERATIONS, Role.ADMIN, Role.SUPER_ADMIN, Role.MERCHANT]);
