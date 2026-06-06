import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid-verification-token', req.url));
    }

    // Find the user with this token and ensure it hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/?error=expired-or-invalid-token', req.url));
    }

    // Mark email as verified and clear verification tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, isEmailVerified: true },
      ipAddress,
    });

    console.log(`[Verification] Email verified successfully for user: ${user.email || user.id}`);

    // Redirect to login page with a success message
    return NextResponse.redirect(new URL('/?success=email-verified', req.url));
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(new URL('/?error=internal-server-error', req.url));
  }
}
