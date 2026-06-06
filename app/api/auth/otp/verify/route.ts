import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashOtp, signToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const verifySchema = z.object({
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
}).refine(data => data.phoneNumber || data.email, {
  message: "Either phoneNumber or email must be provided",
  path: ["phoneNumber", "email"]
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { phoneNumber, email, code } = result.data;
    const identifier = email || phoneNumber!;
    const codeHash = hashOtp(code);

    // Fetch the latest OTP request for this identifier (stored in phoneNumber field of OtpRequest)
    const otpRequest = await prisma.otpRequest.findFirst({
      where: { phoneNumber: identifier },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      return NextResponse.json({ error: 'No OTP request found for this email/phone' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > otpRequest.expiresAt) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Check attempts limit
    if (otpRequest.attempts >= 3) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 });
    }

    // Check hash
    if (otpRequest.codeHash !== codeHash) {
      // Increment attempts
      await prisma.otpRequest.update({
        where: { id: otpRequest.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // OTP is valid! Retrieve or auto-create User
    let user;
    let action = 'USER_LOGIN';
    
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return NextResponse.json({ error: 'User account not found' }, { status: 400 });
      }
      if (!user.isEmailVerified) {
        return NextResponse.json({ error: 'Please verify your email address before logging in.' }, { status: 400 });
      }
    } else {
      const phone = phoneNumber!;
      user = await prisma.user.findUnique({
        where: { phoneNumber: phone },
      });

      if (user) {
        if (user.email && !user.isEmailVerified) {
          return NextResponse.json({ error: 'Please verify your email address before logging in. Check the link sent to your email.' }, { status: 400 });
        }
      } else {
        action = 'USER_REGISTER';
        user = await prisma.user.create({
          data: {
            phoneNumber: phone,
            role: 'CUSTOMER', // Default role
            isEmailVerified: false,
          },
        });
      }
    }

    // Generate JWT
    const token = signToken({ userId: user.id, role: user.role });

    // Record Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: user.id,
      action,
      entity: 'User',
      entityId: user.id,
      newValue: { identifier, role: user.role },
      ipAddress,
    });

    // Delete used OTP request to prevent reuse
    await prisma.otpRequest.deleteMany({
      where: { phoneNumber: identifier },
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
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
