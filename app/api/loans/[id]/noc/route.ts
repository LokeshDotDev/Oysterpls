import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, LoanStatus } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            customer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found' }, { status: 404 });
    }

    // Access control: Only the customer themselves or Admins can access their NOC
    if (session.role === Role.CUSTOMER && loan.application.customerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.role === Role.MERCHANT && loan.application.merchantId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure the loan is actually closed
    if (loan.status !== LoanStatus.CLOSED) {
      return NextResponse.json({
        error: `NOC is not generated yet. Current loan status is ${loan.status}. It must be CLOSED.`,
      }, { status: 400 });
    }

    const customerProfile = loan.application.customer.profile;
    const closingDate = loan.closedAt ? loan.closedAt.toLocaleDateString() : loan.updatedAt.toLocaleDateString();

    const nocHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>No Objection Certificate (NOC) - Loan Account #${loan.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
          .container { border: 2px solid #ddd; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px double #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; color: #111; }
          .subtitle { font-size: 14px; color: #666; margin: 5px 0 0 0; text-transform: uppercase; }
          .date { text-align: right; font-weight: bold; margin-bottom: 20px; }
          .content { margin-bottom: 40px; font-size: 15px; text-align: justify; }
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .details-table td { padding: 10px; border: 1px solid #eee; }
          .details-table td.label { font-weight: bold; background-color: #f9f9f9; width: 35%; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 40%; border-top: 1px solid #333; padding-top: 10px; font-size: 14px; }
          .logo-text { font-size: 20px; font-weight: bold; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo-text">ANTIGRAVITY LENDING</span>
            <div class="title">NO OBJECTION CERTIFICATE</div>
            <div class="subtitle">To Whomsoever It May Concern</div>
          </div>
          
          <div class="date">Date: ${new Date().toLocaleDateString()}</div>
          
          <div class="content">
            This is to certify that <strong>${customerProfile?.fullName || 'Valued Customer'}</strong> 
            (Aadhaar No: XXXX-XXXX-${customerProfile?.aadhaarNumber.substr(-4) || 'XXXX'}) 
            having Loan Account Number <strong>${loan.id}</strong> has fully cleared all 
            outstanding dues towards the loan facility availed from our platform.
          </div>
          
          <div class="content">
            We confirm that as of <strong>${closingDate}</strong>, there are no outstanding financial obligations 
            or liabilities pending against the customer for this specific loan account. We have no objection to the closure of 
            the loan and have released all corresponding claims.
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Customer Name</td>
              <td>${customerProfile?.fullName || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Loan Account ID</td>
              <td>${loan.id}</td>
            </tr>
            <tr>
              <td class="label">Disbursed Amount</td>
              <td>INR ${Number(loan.disbursedAmount).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td class="label">Interest Type</td>
              <td>${loan.interestType}</td>
            </tr>
            <tr>
              <td class="label">Disbursal Date</td>
              <td>${loan.disbursedAt ? loan.disbursedAt.toLocaleDateString() : 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Closure Date</td>
              <td>${closingDate}</td>
            </tr>
          </table>

          <div class="footer">
            <div style="width: 40%;"></div>
            <div class="signature-box">
              Authorized Signatory<br>
              <strong>Antigravity Lending Platform</strong>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(nocHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename=NOC_Loan_${loan.id}.html`,
      },
    });
  } catch (error: any) {
    console.error('NOC generation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.CUSTOMER, Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
