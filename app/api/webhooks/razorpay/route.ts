import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { LoanStatus, ScheduleStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { sendNotification } from '@/lib/notification';

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const signature = req.headers.get('x-razorpay-signature') || '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_789';

    // 1. Signature Verification
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.warn('[Webhook] Invalid webhook signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Idempotency Check
    // Use the event ID from the payload (or generate one for test simulations)
    const eventId = payload.id || `evt_sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const eventType = payload.event;

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.processed) {
      console.log(`[Webhook] Event ${eventId} already processed. Skipping.`);
      return NextResponse.json({ success: true, duplicated: true });
    }

    // Create or update webhook event entry in DB
    const dbEvent = await prisma.webhookEvent.upsert({
      where: { eventId },
      update: {},
      create: {
        eventId,
        eventType,
        payload: payload as any,
        processed: false,
      },
    });

    console.log(`[Webhook] Processing event ${eventId} of type ${eventType}`);

    // 3. Event Router
    switch (eventType) {
      case 'subscription.activated': {
        const subscriptionEntity = payload.payload.subscription.entity;
        const mandateId = subscriptionEntity.id;
        const applicationId = subscriptionEntity.notes?.applicationId;

        if (!applicationId) {
          throw new Error('Missing applicationId in subscription notes');
        }

        const application = await prisma.loanApplication.findUnique({
          where: { id: applicationId },
        });

        if (!application) {
          throw new Error(`Application ${applicationId} not found`);
        }

        // Update Mandate status to ACTIVE
        await prisma.mandate.update({
          where: { applicationId },
          data: { status: 'ACTIVE' },
        });

        // Transition Application to MANDATE_ACTIVE
        await prisma.loanApplication.update({
          where: { id: applicationId },
          data: { status: LoanStatus.MANDATE_ACTIVE },
        });

        await logAudit({
          action: 'WEBHOOK_MANDATE_ACTIVATED',
          entity: 'LoanApplication',
          entityId: applicationId,
          newValue: { status: LoanStatus.MANDATE_ACTIVE },
        });

        console.log(`[Webhook] Mandate activated for Application: ${applicationId}`);
        break;
      }

      case 'subscription.failed': {
        const subscriptionEntity = payload.payload.subscription.entity;
        const applicationId = subscriptionEntity.notes?.applicationId;

        if (applicationId) {
          // Revert back to APPROVED to let user try again
          await prisma.loanApplication.update({
            where: { id: applicationId },
            data: { status: LoanStatus.APPROVED },
          });

          await prisma.mandate.update({
            where: { applicationId },
            data: { status: 'FAILED' },
          });

          console.log(`[Webhook] Mandate activation failed for Application: ${applicationId}`);
        }
        break;
      }

      case 'payment.success':
      case 'payment.captured': {
        const paymentEntity = payload.payload.payment.entity;
        const paymentId = paymentEntity.id;
        
        // Find if we are charging a subscription (auto-debit)
        const subscriptionId = paymentEntity.subscription_id;
        const amountPaise = paymentEntity.amount;
        const amountRupees = amountPaise / 100;

        if (!subscriptionId) {
          console.log('[Webhook] payment.success skipped: not associated with subscription/mandate');
          break;
        }

        // Find the mandate and active loan linked to it
        const mandate = await prisma.mandate.findFirst({
          where: { razorpayMandateId: subscriptionId },
          include: {
            application: {
              include: {
                loan: {
                  include: {
                    schedules: { orderBy: { installmentNo: 'asc' } },
                  },
                },
                customer: true,
              },
            },
          },
        });

        if (!mandate || !mandate.application.loan) {
          console.warn(`[Webhook] No active loan found for subscription ID ${subscriptionId}`);
          break;
        }

        const loan = mandate.application.loan;

        // Create successful Payment Transaction record
        const transaction = await prisma.paymentTransaction.create({
          data: {
            loanId: loan.id,
            amount: amountRupees,
            type: TransactionType.EMI_REPAYMENT,
            status: TransactionStatus.SUCCESS,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
          },
        });

        // Find the oldest pending or failed/overdue EMI schedule to apply payment
        const targetSchedule = loan.schedules.find(
          (s) => s.status === ScheduleStatus.PENDING || s.status === ScheduleStatus.OVERDUE || s.status === ScheduleStatus.FAILED
        );

        if (targetSchedule) {
          const unpaidOnSchedule = Number(targetSchedule.amountDue) + Number(targetSchedule.penaltyAccrued) + Number(targetSchedule.lateFeeAccrued) - Number(targetSchedule.amountPaid);
          const paymentApplied = Math.min(amountRupees, unpaidOnSchedule);

          // Update EMI schedule status
          const isFullyPaid = paymentApplied >= unpaidOnSchedule;
          await prisma.eMISchedule.update({
            where: { id: targetSchedule.id },
            data: {
              amountPaid: Number(targetSchedule.amountPaid) + paymentApplied,
              status: isFullyPaid ? ScheduleStatus.PAID : ScheduleStatus.PENDING,
              paidAt: isFullyPaid ? new Date() : null,
            },
          });

          // Update Loan metrics
          const newOutstanding = Math.max(0, Number(loan.outstandingAmount) - paymentApplied);
          
          // Deduct interest component first, then principal
          const interestPaidPortion = Math.min(paymentApplied, Number(targetSchedule.interest));
          const principalPaidPortion = Math.max(0, paymentApplied - interestPaidPortion);

          await prisma.loan.update({
            where: { id: loan.id },
            data: {
              outstandingAmount: newOutstanding,
              principalPaid: Number(loan.principalPaid) + principalPaidPortion,
              interestPaid: Number(loan.interestPaid) + interestPaidPortion,
              status: newOutstanding === 0 ? LoanStatus.CLOSED : loan.status,
              closedAt: newOutstanding === 0 ? new Date() : null,
            },
          });

          // If loan outstanding reaches 0, close application as well
          if (newOutstanding === 0) {
            await prisma.loanApplication.update({
              where: { id: loan.applicationId },
              data: { status: LoanStatus.CLOSED },
            });
            console.log(`[Webhook] Loan ${loan.id} fully repaid and CLOSED.`);
            
            // Notify customer about closure
            await sendNotification({
              userId: mandate.application.customerId,
              channel: 'SMS',
              recipient: mandate.application.customer.phoneNumber,
              content: `Great news! Your loan account ${loan.id} has been fully closed. Your No Objection Certificate (NOC) is available for download on your dashboard.`,
            });
          } else {
            // Notify customer of successful EMI deduction
            await sendNotification({
              userId: mandate.application.customerId,
              channel: 'SMS',
              recipient: mandate.application.customer.phoneNumber,
              content: `Repayment received: ₹${amountRupees} has been successfully credited to your loan account ${loan.id}. Outstanding: ₹${newOutstanding}.`,
            });
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payload.payment.entity;
        const subscriptionId = paymentEntity.subscription_id;
        const amountRupees = paymentEntity.amount / 100;
        const errorDesc = paymentEntity.error_description || 'Auto-debit declined';

        if (!subscriptionId) break;

        const mandate = await prisma.mandate.findFirst({
          where: { razorpayMandateId: subscriptionId },
          include: {
            application: {
              include: {
                loan: {
                  include: {
                    schedules: { orderBy: { installmentNo: 'asc' } },
                  },
                },
                customer: true,
              },
            },
          },
        });

        if (mandate && mandate.application.loan) {
          const loan = mandate.application.loan;

          // Record payment failure transaction
          await prisma.paymentTransaction.create({
            data: {
              loanId: loan.id,
              amount: amountRupees,
              type: TransactionType.EMI_REPAYMENT,
              status: TransactionStatus.FAILED,
              errorMessage: errorDesc,
            },
          });

          // Set loan to OVERDUE
          await prisma.loan.update({
            where: { id: loan.id },
            data: { status: LoanStatus.OVERDUE },
          });

          // Find current overdue installment
          const targetSchedule = loan.schedules.find(
            (s) => s.status === ScheduleStatus.PENDING || s.status === ScheduleStatus.OVERDUE
          );

          if (targetSchedule) {
            // Apply a flat bounce penalty on failure
            const bounceCharge = 350; // flat charge
            await prisma.eMISchedule.update({
              where: { id: targetSchedule.id },
              data: {
                status: ScheduleStatus.OVERDUE,
                penaltyAccrued: Number(targetSchedule.penaltyAccrued) + bounceCharge,
                amountDue: Number(targetSchedule.amountDue) + bounceCharge,
              },
            });

            // Update outstanding amount on Loan
            await prisma.loan.update({
              where: { id: loan.id },
              data: {
                outstandingAmount: Number(loan.outstandingAmount) + bounceCharge,
              },
            });

            // Notify Customer of EMI failure and penalty
            await sendNotification({
              userId: mandate.application.customerId,
              channel: 'SMS',
              recipient: mandate.application.customer.phoneNumber,
              content: `ALERT: Auto-debit deduction of ₹${amountRupees} for your loan EMI has failed. A bounce penalty of ₹${bounceCharge} has been applied. Total outstanding due is now overdue. Please pay immediately.`,
            });
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    // Mark event as processed successfully
    await prisma.webhookEvent.update({
      where: { id: dbEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook Error]', error);
    
    // Attempt logging the failure to the WebhookEvent database table
    try {
      const payloadObj = rawBody ? JSON.parse(rawBody) : {};
      const eventId = payloadObj.id || `evt_err_${Date.now()}`;
      await prisma.webhookEvent.upsert({
        where: { eventId },
        update: { error: error.message },
        create: {
          eventId,
          eventType: payloadObj.event || 'unknown',
          payload: payloadObj,
          processed: false,
          error: error.message,
        },
      });
    } catch {}

    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
