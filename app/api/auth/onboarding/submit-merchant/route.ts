import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    });

    if (!user || user.role !== Role.MERCHANT) {
      return NextResponse.json({ error: 'Merchant user not found' }, { status: 404 });
    }

    // Ensure profile exists
    const profile = user.profile;
    if (!profile) {
      return NextResponse.json({ error: 'Please save your profile details before submitting.' }, { status: 400 });
    }

    // Ensure they have filled out basic fields (ignoring seeded mock placeholders)
    if (!profile.shopName || profile.shopName.trim() === '') {
      return NextResponse.json({ error: 'Shop Name is required.' }, { status: 400 });
    }
    if (!profile.gstNumber || profile.gstNumber.trim() === '') {
      return NextResponse.json({ error: 'GST Number is required.' }, { status: 400 });
    }
    if (!profile.panNumber || profile.panNumber.startsWith('MOCK')) {
      return NextResponse.json({ error: 'Please update your PAN Card details.' }, { status: 400 });
    }
    if (!profile.aadhaarNumber || profile.aadhaarNumber.startsWith('9999')) {
      return NextResponse.json({ error: 'Please update your Aadhaar Card details.' }, { status: 400 });
    }
    if (!profile.bankAccountNo || profile.bankAccountNo === '0000000000') {
      return NextResponse.json({ error: 'Please update your Bank Settlement Account Number.' }, { status: 400 });
    }

    // Ensure documents are uploaded
    const docsCount = await prisma.document.count({
      where: {
        profileId: profile.id,
        type: { in: ['PAN', 'AADHAAR', 'SELFIE'] },
      },
    });

    if (docsCount < 3) {
      return NextResponse.json({ error: 'Please upload all required document scans (PAN Card, Aadhaar Card, and Selfie).' }, { status: 400 });
    }

    // Update user's merchantStatus to PENDING_APPROVAL
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        merchantStatus: 'PENDING_APPROVAL',
      },
    });

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'SUBMIT_MERCHANT_ONBOARDING',
      entity: 'User',
      entityId: session.userId,
      newValue: { merchantStatus: 'PENDING_APPROVAL' },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding application submitted successfully for admin approval',
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        role: updatedUser.role,
        merchantStatus: updatedUser.merchantStatus,
      },
    });
  } catch (error: any) {
    console.error('Error submitting merchant onboarding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.MERCHANT]);
