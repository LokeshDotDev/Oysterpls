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
    
    // Generate OTP
    const code = generateOtp();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Save to Database
    await prisma.otpRequest.create({
      data: {
        phoneNumber: identifier,
        codeHash,
        expiresAt,
      },
    });

    // Send Notification
    if (email) {
      await sendNotification({
        userId: 'SYSTEM',
        channel: 'EMAIL',
        recipient: email,
        subject: 'Onboarding - Customer Verification OTP',
        content: `Your verification OTP is: ${code}.\n\nThis OTP is valid for 5 minutes. Do not share this code.`,
      });
    } else if (phoneNumber) {
      await sendNotification({
        userId: 'SYSTEM',
        channel: 'SMS',
        recipient: phoneNumber,
        content: `Your verification OTP is: ${code}. Valid for 5 minutes.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      ...(process.env.NODE_ENV !== 'production' && { mockOtp: code }),
    });
  } catch (error: any) {
    console.error('Error generating onboarding OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
