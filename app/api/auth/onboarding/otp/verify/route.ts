import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashOtp } from '@/lib/auth';

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

    // Fetch the latest OTP request for this identifier
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

    // Delete used OTP requests to prevent reuse
    await prisma.otpRequest.deleteMany({
      where: { phoneNumber: identifier },
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error: any) {
    console.error('Error verifying onboarding OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
