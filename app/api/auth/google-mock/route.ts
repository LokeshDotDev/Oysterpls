import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOtp, hashOtp } from '@/lib/auth';
import { sendNotification } from '@/lib/notification';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const selectedRole = role || Role.CUSTOMER;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-register customer/merchant/admin
      const mockPhone = `+91${Math.floor(6000000000 + Math.random() * 4000000000)}`;
      user = await prisma.user.create({
        data: {
          email,
          phoneNumber: mockPhone,
          role: selectedRole,
          isEmailVerified: true, // Google login implies email is verified
          profile: {
            create: {
              fullName: email.split('@')[0].toUpperCase(),
              dob: new Date('1995-01-01'),
              panNumber: `MOCKG${Math.floor(1000 + Math.random() * 9000)}G`,
              aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
              monthlyIncome: 0,
              employmentType: 'SALARIED',
              employmentDuration: 0,
              addressLine1: 'Google OAuth Sandbox St.',
              pincode: '400001',
              city: 'Mumbai',
              state: 'Maharashtra',
              bankAccountNo: '9999999999',
              bankIfsc: 'ICIC0000001',
              bankName: 'ICICI Bank',
            },
          },
        },
      });
      console.log(`[Google Mock] Auto-registered user: ${email} with role ${selectedRole}`);
    } else {
      // Ensure email verified is set
      if (!user.isEmailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
    }

    // Generate login OTP
    const code = generateOtp();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save to Database (OtpRequest)
    await prisma.otpRequest.create({
      data: {
        phoneNumber: email, // reuse phoneNumber column for email identifier
        codeHash,
        expiresAt,
      },
    });

    // Send email notification
    await sendNotification({
      userId: user.id,
      channel: 'EMAIL',
      recipient: email,
      subject: 'Antigravity LMS - Google Login 2FA OTP',
      content: `Hi ${email.split('@')[0]},\n\nYou have signed in via Google. To complete entry, verify your account with this OTP: ${code}.\n\nValid for 5 minutes.`,
    });

    return NextResponse.json({
      success: true,
      email,
      mockOtp: code,
      message: 'Google login simulation successful. OTP dispatched to email.',
    });
  } catch (error: any) {
    console.error('Error in mock Google login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
