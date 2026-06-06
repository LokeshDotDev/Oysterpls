import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'PORTFOLIO';

    switch (reportType.toUpperCase()) {
      case 'PORTFOLIO': {
        const activeLoansCount = await prisma.loan.count({ where: { status: 'ACTIVE' } });
        const overdueLoansCount = await prisma.loan.count({ where: { status: 'OVERDUE' } });
        const closedLoansCount = await prisma.loan.count({ where: { status: 'CLOSED' } });

        const outstandingSum = await prisma.loan.aggregate({
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          _sum: {
            outstandingAmount: true,
            disbursedAmount: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            activeLoansCount,
            overdueLoansCount,
            closedLoansCount,
            totalDisbursed: Number(outstandingSum._sum.disbursedAmount || 0),
            totalOutstanding: Number(outstandingSum._sum.outstandingAmount || 0),
          },
        });
      }

      case 'DISBURSEMENT': {
        const disbursements = await prisma.loan.findMany({
          select: {
            disbursedAmount: true,
            disbursedAt: true,
            application: {
              select: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { disbursedAt: 'desc' },
        });

        // Group by product name
        const productStats: Record<string, { count: number; sum: number }> = {};
        let grandTotal = 0;

        disbursements.forEach((d) => {
          const pName = d.application.product.name;
          const amt = Number(d.disbursedAmount);
          grandTotal += amt;

          if (!productStats[pName]) {
            productStats[pName] = { count: 0, sum: 0 };
          }
          productStats[pName].count += 1;
          productStats[pName].sum += amt;
        });

        return NextResponse.json({
          success: true,
          data: {
            grandTotal,
            products: productStats,
            records: disbursements.map((d) => ({
              amount: Number(d.disbursedAmount),
              date: d.disbursedAt,
              product: d.application.product.name,
            })),
          },
        });
      }

      case 'COLLECTION': {
        const collections = await prisma.paymentTransaction.findMany({
          where: {
            type: 'EMI_REPAYMENT',
            status: 'SUCCESS',
          },
          select: {
            amount: true,
            createdAt: true,
            loan: {
              select: {
                application: {
                  select: {
                    product: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        let totalCollected = 0;
        const productCollections: Record<string, number> = {};

        collections.forEach((c) => {
          const pName = c.loan.application.product.name;
          const amt = Number(c.amount);
          totalCollected += amt;
          productCollections[pName] = (productCollections[pName] || 0) + amt;
        });

        return NextResponse.json({
          success: true,
          data: {
            totalCollected,
            products: productCollections,
            records: collections.map((c) => ({
              amount: Number(c.amount),
              date: c.createdAt,
              product: c.loan.application.product.name,
            })),
          },
        });
      }

      case 'RECOVERY': {
        const overdueLoans = await prisma.loan.findMany({
          where: { status: 'OVERDUE' },
          include: {
            schedules: {
              where: { status: 'OVERDUE' },
            },
            application: {
              include: { customer: { include: { profile: true } } },
            },
          },
        });

        let totalOverdueBalance = 0;
        let totalDPD = 0;

        const records = overdueLoans.map((l) => {
          const balance = Number(l.outstandingAmount);
          totalOverdueBalance += balance;

          // DPD calculation based on oldest overdue schedule
          let dpd = 0;
          if (l.schedules.length > 0) {
            const oldestDueDate = new Date(Math.min(...l.schedules.map((s) => s.dueDate.getTime())));
            dpd = Math.max(0, Math.floor((Date.now() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24)));
            totalDPD += dpd;
          }

          return {
            loanId: l.id,
            customerName: l.application.customer.profile?.fullName || 'Unknown',
            outstandingAmount: balance,
            dpd,
            overdueInstallmentsCount: l.schedules.length,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            totalOverdueBalance,
            overdueCount: overdueLoans.length,
            averageDPD: overdueLoans.length > 0 ? Math.round(totalDPD / overdueLoans.length) : 0,
            records,
          },
        });
      }

      case 'REVENUE': {
        // Revenue comes from interest paid, processing fees from disbursements, and penalties paid
        const loansAggregate = await prisma.loan.aggregate({
          _sum: {
            interestPaid: true,
            penaltiesPaid: true,
          },
        });

        // Sum up processing fees (simplification: assume processing fee is added to revenue when loan is created)
        const productsCount = await prisma.loan.findMany({
          select: {
            application: {
              select: {
                product: {
                  select: { processingFee: true },
                },
              },
            },
          },
        });

        const totalProcessingFees = productsCount.reduce(
          (sum, l) => sum + Number(l.application.product.processingFee),
          0
        );

        const interestRevenue = Number(loansAggregate._sum.interestPaid || 0);
        const penaltyRevenue = Number(loansAggregate._sum.penaltiesPaid || 0);

        return NextResponse.json({
          success: true,
          data: {
            interestRevenue,
            penaltyRevenue,
            processingFeeRevenue: totalProcessingFees,
            totalRevenue: interestRevenue + penaltyRevenue + totalProcessingFees,
          },
        });
      }

      case 'AUDIT_LOG': {
        const auditLogs = await prisma.auditLog.findMany({
          include: {
            user: {
              select: {
                phoneNumber: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // retrieve the latest 100 entries
        });

        return NextResponse.json({
          success: true,
          data: {
            logs: auditLogs.map((l) => ({
              id: l.id,
              actor: l.user ? `${l.user.role} (${l.user.phoneNumber})` : 'SYSTEM',
              action: l.action,
              entity: l.entity,
              entityId: l.entityId,
              oldValue: l.oldValue,
              newValue: l.newValue,
              ipAddress: l.ipAddress,
              timestamp: l.createdAt,
            })),
          },
        });
      }

      default:
        return NextResponse.json({ error: `Invalid report type: ${reportType}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Reports endpoint failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
