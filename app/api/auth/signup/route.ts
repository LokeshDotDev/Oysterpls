import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { sendNotification } from '@/lib/notification';
import { Role } from '@prisma/client';
import { signToken } from '@/lib/auth';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must be in E.164 format (e.g. +919999999999)'),
  role: z.nativeEnum(Role).default(Role.CUSTOMER),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { fullName, email, phoneNumber, role } = result.data;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email address is already registered' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Phone number is already registered' }, { status: 400 });
    }

    // 2. Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const isMerchant = role === Role.MERCHANT;

    // 3. Create User with role and profile
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        email,
        role,
        isEmailVerified: isMerchant ? true : false,
        emailVerificationToken: isMerchant ? null : token,
        emailVerificationExpires: isMerchant ? null : expires,
        merchantStatus: isMerchant ? 'NOT_STARTED' : null,
        profile: {
          create: {
            fullName,
            dob: new Date('1995-01-01'), // Default placeholder, will be completed in onboarding
            panNumber: `MOCKP${Math.floor(1000 + Math.random() * 9000)}P`, // Placeholder to satisfy unique constraints
            aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`, // Placeholder to satisfy unique constraints
            monthlyIncome: 0,
            employmentType: 'SALARIED',
            employmentDuration: 0,
            addressLine1: 'Placeholder Address',
            pincode: '000000',
            city: 'Placeholder City',
            state: 'Placeholder State',
            bankAccountNo: '0000000000',
            bankIfsc: 'ICIC0000000',
            bankName: 'Placeholder Bank',
            // Default onboarding status for merchant
            addressProofType: isMerchant ? 'PENDING' : null,
          },
        },
      },
    });

    if (isMerchant) {
      // Direct login for merchants
      const jwtToken = signToken({ userId: user.id, role: user.role });

      const response = NextResponse.json({
        success: true,
        directLogin: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
        },
        token: jwtToken,
      });

      response.cookies.set({
        name: 'token',
        value: jwtToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // 4. Send email verification link
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const verificationUrl = `${protocol}://${host}/api/auth/verify-email?token=${token}`;

    try {
      await sendNotification({
        userId: user.id,
        channel: 'EMAIL',
        recipient: email,
        subject: 'Verify your Oysterpls Account',
        content: `Welcome to Oysterpls Lending Platform, ${fullName}!\n\nPlease verify your account by clicking the link below:\n\n${verificationUrl}\n\nThis link is valid for 24 hours.`,
      });
    } catch (notificationError) {
      console.error('Failed to send verification email during signup:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Verification email sent.',
      ...(process.env.NODE_ENV !== 'production' && { mockVerifyLink: verificationUrl }),
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
