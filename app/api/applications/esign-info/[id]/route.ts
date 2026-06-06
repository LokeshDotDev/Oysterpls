import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, context: any) {
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
              select: {
                fullName: true,
                panNumber: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        mandate: {
          select: {
            authUrl: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Return a subset of public info for E-Sign verification
    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        requestedAmount: application.requestedAmount,
        requestedTenure: application.requestedTenure,
        productName: application.productName || application.product.name,
        customer: {
          phoneNumber: application.customer.phoneNumber,
          email: application.customer.email,
          profile: {
            fullName: application.customer.profile?.fullName || '',
            panNumber: application.customer.profile?.panNumber || '', // Send for matching
          },
        },
        mandate: application.mandate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public esign info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
