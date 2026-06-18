import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';
import { logAudit } from '@/lib/audit';

// GET all credentials
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        password: true,
        merchantStatus: true,
        isBanned: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            shopName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, credentials: users });
  } catch (err: any) {
    console.error('Error fetching admin credentials:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);

// POST to resend credentials via email
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User does not have a registered email address' }, { status: 400 });
    }

    const password = user.password || 'TemporaryPassword123';

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'ADMIN_RESEND_CREDENTIALS',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
      ipAddress,
    });

    // Send email
    await sendNotification({
      userId: user.id,
      channel: 'EMAIL',
      recipient: user.email,
      subject: 'Oysterpls LMS - Login Credentials Recovery',
      content: `Hello ${user.profile?.fullName || 'User'},\n\nAt your request, an administrator has dispatched your account recovery credentials.\n\nHere are your login details:\n- Username/Email: ${user.email}\n- Phone: ${user.phoneNumber}\n- Password: ${password}\n\nPlease verify these credentials to log in.`,
    });

    return NextResponse.json({ success: true, message: 'Credentials email sent successfully' });
  } catch (err: any) {
    console.error('Error resending credentials:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
