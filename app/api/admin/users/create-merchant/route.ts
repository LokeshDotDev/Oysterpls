import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';
import { logAudit } from '@/lib/audit';

const createMerchantSchema = z.object({
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (e.g. +919999999999)'),
  password: z.string().optional(),
  fullName: z.string().min(2, 'Owner Name must be at least 2 characters'),
  dob: z.string().transform((str) => new Date(str)),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card format'),
  aadhaarNumber: z.string().length(12, 'Aadhaar must be exactly 12 digits').regex(/^[0-9]+$/, 'Aadhaar must contain only numbers'),
  shopName: z.string().min(2, 'Shop Name must be at least 2 characters'),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'),
  bankAccountNo: z.string().min(9).max(18, 'Account number must be 9 to 18 digits'),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'),
  bankName: z.string().min(3),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits'),
  city: z.string().min(2),
  state: z.string().min(2),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = createMerchantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const finalPassword = data.password || `Merchant-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Check duplicate user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phoneNumber: data.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or phone number is already registered to another account' }, { status: 400 });
    }

    // 2. Check duplicate profile details (PAN, Aadhaar)
    const dupCheck = await prisma.profile.findFirst({
      where: {
        OR: [
          { panNumber: data.panNumber },
          { aadhaarNumber: data.aadhaarNumber },
        ],
      },
    });

    if (dupCheck) {
      if (dupCheck.panNumber === data.panNumber) {
        return NextResponse.json({ error: 'PAN number is already registered to another account' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Aadhaar number is already registered to another account' }, { status: 400 });
    }

    // 3. Create merchant user & pre-filled approved profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: finalPassword,
          role: Role.MERCHANT,
          isEmailVerified: true,
          merchantStatus: 'APPROVED',
          profile: {
            create: {
              fullName: data.fullName,
              dob: data.dob,
              panNumber: data.panNumber,
              aadhaarNumber: data.aadhaarNumber,
              shopName: data.shopName,
              gstNumber: data.gstNumber,
              bankAccountNo: data.bankAccountNo,
              bankIfsc: data.bankIfsc,
              bankName: data.bankName,
              addressLine1: data.addressLine1,
              addressLine2: data.addressLine2 || null,
              pincode: data.pincode,
              city: data.city,
              state: data.state,
              monthlyIncome: 0,
              employmentType: 'SELF_EMPLOYED',
              employmentDuration: 0,
            },
          },
        },
        include: {
          profile: true,
        },
      });
      return u;
    });

    // 4. Record Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'ADMIN_CREATE_MERCHANT',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, shopName: data.shopName },
      ipAddress,
    });

    // 5. Send Notification containing Login Credentials
    try {
      await sendNotification({
        userId: user.id,
        channel: 'EMAIL',
        recipient: data.email,
        subject: 'Welcome to Oysterpls - Merchant Account Created',
        content: `Welcome to Oysterpls Lending Platform, ${data.fullName}!\n\nAn administrator has successfully created and pre-approved your merchant store account.\n\nHere are your login credentials:\n- Username/Email: ${data.email}\n- Phone: ${data.phoneNumber}\n- Password: ${finalPassword}\n\nYou can log in directly and start onboarding customers immediately. No further onboarding profile submission is required.`,
      });
    } catch (emailErr) {
      console.error('Failed to send merchant account credentials:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Merchant account created and pre-approved successfully',
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        merchantStatus: user.merchantStatus,
      },
    });
  } catch (error: any) {
    console.error('Error creating merchant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
