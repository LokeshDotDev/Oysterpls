import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';
import { logAudit } from '@/lib/audit';

// GET customer credentials linked to the merchant
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    // Find customer IDs from applications linked to the merchant
    const applications = await prisma.loanApplication.findMany({
      where: { merchantId: session.userId },
      select: { customerId: true },
    });

    const customerIds = Array.from(new Set(applications.map((a) => a.customerId)));

    const customers = await prisma.user.findMany({
      where: {
        id: { in: customerIds },
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        password: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, credentials: customers });
  } catch (err: any) {
    console.error('Error fetching merchant customer credentials:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.MERCHANT]);

// POST to resend customer credentials from merchant
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify customer is linked to this merchant via applications
    const hasApplication = await prisma.loanApplication.findFirst({
      where: {
        merchantId: session.userId,
        customerId: userId,
      },
    });

    if (!hasApplication) {
      return NextResponse.json({ error: 'Unauthorized to manage this customer\'s credentials' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email not registered' }, { status: 400 });
    }

    const password = user.password || 'TemporaryPassword123';

    // Log audit
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'MERCHANT_RESEND_CREDENTIALS',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email },
      ipAddress,
    });

    // Send email
    await sendNotification({
      userId: user.id,
      channel: 'EMAIL',
      recipient: user.email,
      subject: 'Oysterpls LMS - Login Credentials Recovered',
      content: `Hello ${user.profile?.fullName || 'User'},\n\nYour store merchant has resent your login credentials.\n\nHere are your access details:\n- Username/Email: ${user.email}\n- Phone: ${user.phoneNumber}\n- Password: ${password}\n\nPlease use these credentials to log in.`,
    });

    return NextResponse.json({ success: true, message: 'Credentials email sent successfully' });
  } catch (err: any) {
    console.error('Error resending customer credentials:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.MERCHANT]);
