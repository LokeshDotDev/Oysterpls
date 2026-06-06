import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/authOptions';
import prisma from '@/lib/db';
import { generateOtp, hashOtp } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized NextAuth session' }, { status: 401 });
    }

    const email = session.user.email;

    // Verify if user already exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User registration failed' }, { status: 400 });
    }

    // Generate login OTP
    const code = generateOtp();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save to Database (OtpRequest)
    await prisma.otpRequest.create({
      data: {
        phoneNumber: email, // reuse phoneNumber column for email
        codeHash,
        expiresAt,
      },
    });

    // Send email
    await sendNotification({
      userId: user.id,
      channel: 'EMAIL',
      recipient: email,
      subject: 'Antigravity LMS - Google Login 2FA OTP',
      content: `Hi,\n\nYou have signed in via Google. To complete entry, verify your account with this OTP: ${code}.\n\nValid for 5 minutes.`,
    });

    return NextResponse.json({
      success: true,
      email,
      mockOtp: process.env.NODE_ENV !== 'production' ? code : null,
      message: 'Google login 2FA OTP dispatched successfully.',
    });
  } catch (error: any) {
    console.error('Error in nextauth-callback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
