import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, VerificationStatus } from '@prisma/client';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find the merchant user
    const merchantUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!merchantUser || merchantUser.role !== Role.MERCHANT) {
      return NextResponse.json({ error: 'Merchant user not found' }, { status: 404 });
    }

    // Update user's merchantStatus
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        merchantStatus: status,
      },
    });

    // Update merchant's documents status
    if (merchantUser.profile) {
      const docStatus = status === 'APPROVED' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
      
      // Update Aadhaar, PAN, and Selfie documents
      await prisma.document.updateMany({
        where: {
          profileId: merchantUser.profile.id,
          type: { in: ['AADHAAR', 'PAN', 'SELFIE'] },
          status: VerificationStatus.PENDING,
        },
        data: {
          status: docStatus,
          verifiedById: session.userId,
          verifiedAt: new Date(),
          ...(status === 'REJECTED' && { rejectionReason: rejectionReason || 'Merchant onboarding rejected' }),
        },
      });
    }

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: status === 'APPROVED' ? 'APPROVE_MERCHANT' : 'REJECT_MERCHANT',
      entity: 'User',
      entityId: id,
      newValue: { merchantStatus: status, rejectionReason },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Merchant has been ${status.toLowerCase()} successfully`,
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        role: updatedUser.role,
        merchantStatus: updatedUser.merchantStatus,
      },
    });
  } catch (error: any) {
    console.error('Error verifying merchant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
