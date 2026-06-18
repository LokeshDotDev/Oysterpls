import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { notifyCustomerLogin } from '@/lib/notification';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier (Email or Phone) is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { identifier, password } = result.data;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid identifier or password' }, { status: 400 });
    }

    // Verify password match
    if (!user.password || user.password !== password) {
      return NextResponse.json({ error: 'Invalid identifier or password' }, { status: 400 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Forbidden: Account suspended by administrator' }, { status: 403 });
    }

    // If merchant, bypass email verification check (or enforce it, let's keep consistent with OTP verify)
    if (user.email && !user.isEmailVerified && user.role !== 'MERCHANT') {
      return NextResponse.json({ error: 'Please verify your email address before logging in.' }, { status: 400 });
    }

    // Generate JWT
    const token = signToken({ userId: user.id, role: user.role });

    // Notify merchants if customer logs in
    if (user.role === 'CUSTOMER') {
      await notifyCustomerLogin(user.id);
    }

    // Record Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN_PASSWORD',
      entity: 'User',
      entityId: user.id,
      newValue: { identifier, role: user.role },
      ipAddress,
    });

    // Setup secure HttpOnly cookie response
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        merchantStatus: user.merchantStatus,
      },
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in login-password API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
