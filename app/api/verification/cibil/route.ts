import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const { customerId, panNumber, dob, fullName, consent } = await req.json();

    if (!customerId || !panNumber || !consent) {
      return NextResponse.json({ error: 'Missing required parameters (customerId, panNumber, consent)' }, { status: 400 });
    }

    // Lookup profile
    const profile = await prisma.profile.findUnique({
      where: { userId: customerId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Customer profile not found. Complete profile details first.' }, { status: 400 });
    }

    // Determine mock CIBIL score:
    // If the PAN number starts with 'T' (e.g. TSTPA1234E), return 580 (triggers low CIBIL risk fail)
    // Otherwise return a healthy 765 score.
    const score = panNumber.startsWith('T') ? 580 : 765;

    // Save CIBIL score to profile
    await prisma.profile.update({
      where: { id: profile.id },
      data: { cibilScore: score },
    });

    // Mock Decentro API full response format
    const decentroMockResponse = {
      success: true,
      status: 'SUCCESS',
      message: 'Credit report fetched successfully via Decentro Sandbox.',
      data: {
        bureau: 'CIBIL',
        score: score,
        summary: {
          activeAccounts: score > 600 ? 2 : 5,
          overdueAccounts: score > 600 ? 0 : 2,
          totalOutstandingBalance: score > 600 ? 125000 : 450000,
          recentInquiries: score > 600 ? 1 : 8,
          suitFiled: false,
          writtenOffAmount: score > 600 ? 0 : 75000,
        },
        reportId: `dec_rep_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        statusDescription: score > 600 ? 'Excellent Credit Profile' : 'High Credit Risk Profile',
      },
    };

    console.log(`[Decentro Mock] Pulled CIBIL score ${score} for customer ${customerId} (PAN: ${panNumber})`);

    return NextResponse.json(decentroMockResponse);
  } catch (error: any) {
    console.error('CIBIL fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
