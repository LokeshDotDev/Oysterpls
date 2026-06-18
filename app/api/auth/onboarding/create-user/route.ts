import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';

const createUserSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must be in E.164 format (e.g. +919999999999)'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { phoneNumber, email, password } = result.data;
    const finalPassword = password || `Oyster-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if user with phone or email already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (user) {
      // User exists! Let's update email verification status if needed and return
      let needsUpdate = false;
      const dataToUpdate: any = {};
      
      if (!user.isEmailVerified) {
        dataToUpdate.isEmailVerified = true;
        needsUpdate = true;
      }
      
      // Update email on user if not set (e.g. if they only had a phone number)
      if (!user.email) {
        dataToUpdate.email = email;
        needsUpdate = true;
      }

      // Update password if not set
      if (!user.password) {
        dataToUpdate.password = finalPassword;
        needsUpdate = true;
      }

      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate,
          include: { profile: true },
        });
      }
      
      // If profile is missing, create it
      if (!user.profile) {
        await prisma.profile.create({
          data: {
            userId: user.id,
            fullName: 'Customer Prospect',
            dob: new Date('1995-01-01'),
            panNumber: `MOCKP${Math.floor(1000 + Math.random() * 9000)}P`,
            aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
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
          },
        });
      }

      // Email credentials
      try {
        await sendNotification({
          userId: user.id,
          channel: 'EMAIL',
          recipient: email,
          subject: 'Oysterpls LMS - Customer Account Onboarded',
          content: `Hello!\n\nYour merchant has created an account for you on the Oysterpls Lending Platform.\n\nHere are your login credentials:\n- Username/Email: ${email}\n- Phone: ${phoneNumber}\n- Password: ${user.password || finalPassword}\n\nYou can use these details to log in to the application directly.`,
        });
      } catch (emailErr) {
        console.error('Failed to send customer email credentials:', emailErr);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
      });
    }

    // Register a new customer user and empty profile
    user = await prisma.user.create({
      data: {
        phoneNumber,
        email,
        password: finalPassword,
        role: Role.CUSTOMER,
        isEmailVerified: true, // Verification OTP verified by merchant
        profile: {
          create: {
            fullName: 'Customer Prospect',
            dob: new Date('1995-01-01'),
            panNumber: `MOCKP${Math.floor(1000 + Math.random() * 9000)}P`,
            aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
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
          },
        },
      },
      include: {
        profile: true,
      },
    });

    console.log(`[Onboarding] Customer user created: ${user.id} (Email: ${email}, Phone: ${phoneNumber})`);

    // Email credentials
    try {
      await sendNotification({
        userId: user.id,
        channel: 'EMAIL',
        recipient: email,
        subject: 'Oysterpls LMS - Customer Account Onboarded',
        content: `Hello!\n\nYour merchant has created an account for you on the Oysterpls Lending Platform.\n\nHere are your login credentials:\n- Username/Email: ${email}\n- Phone: ${phoneNumber}\n- Password: ${finalPassword}\n\nYou can use these details to log in to the application directly.`,
      });
    } catch (emailErr) {
      console.error('Failed to send customer email credentials:', emailErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Error creating customer user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
