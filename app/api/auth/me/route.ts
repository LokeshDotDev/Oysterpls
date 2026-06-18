import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        role: true,
        merchantStatus: true,
        profilePictureUrl: true,
        profile: {
          select: {
            fullName: true,
            shopName: true,
            dob: true,
            addressLine1: true,
            addressLine2: true,
            pincode: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: session.role,
        merchantStatus: user.merchantStatus,
        profilePictureUrl: user.profilePictureUrl,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
