import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { generateOtp, hashOtp } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';

const requestSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must be in E.164 format (e.g. +919999999999)').optional(),
  email: z.string().email('Invalid email format').optional(),
}).refine(data => data.phoneNumber || data.email, {
  message: "Either phoneNumber or email must be provided",
  path: ["phoneNumber", "email"]
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { phoneNumber, email } = result.data;
    const identifier = email || phoneNumber!;
    
    // Check if user exists and if they are verified (if email-based login)
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return NextResponse.json({ error: 'No account found with this email. Please sign up first.' }, { status: 400 });
      }
      if (!user.isEmailVerified) {
        return NextResponse.json({ error: 'Please verify your email address before logging in. Check the link sent to your email.' }, { status: 400 });
      }
    }

    // Generate OTP
    const code = generateOtp();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Save to Database (we reuse the phoneNumber field in OtpRequest to store email or phone)
    await prisma.otpRequest.create({
      data: {
        phoneNumber: identifier,
        codeHash,
        expiresAt,
      },
    });

    const user = await prisma.user.findFirst({
      where: email ? { email } : { phoneNumber },
    });

    // Send Notification
    if (email) {
      await sendNotification({
        userId: user ? user.id : 'SYSTEM',
        channel: 'EMAIL',
        recipient: email,
        subject: 'Oysterpls LMS - Login Verification OTP',
        content: `Your login verification code is: ${code}.\n\nThis OTP is valid for 5 minutes. Do not share this code with anyone.`,
      });
    } else if (phoneNumber) {
      if (user) {
        await sendNotification({
          userId: user.id,
          channel: 'SMS',
          recipient: phoneNumber,
          content: `Your Digital Lending Platform verification code is: ${code}. Valid for 5 minutes.`,
        });
      } else {
        console.log(`[Notification MOCK] SMS OTP to ${phoneNumber}: Your verification code is ${code}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      // Return code in dev for testing convenience
      ...(process.env.NODE_ENV !== 'production' && { mockOtp: code }),
    });
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
