import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional().nullable(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().nullable(),
  dob: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits').optional().nullable().or(z.literal('')),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // 1. Verify User exists
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Email uniqueness check
    if (data.email && data.email !== user.email) {
      const dupEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (dupEmail) {
        return NextResponse.json({ error: 'Email address is already in use by another account' }, { status: 400 });
      }
    }

    // 3. Phone uniqueness check
    if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
      const dupPhone = await prisma.user.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });
      if (dupPhone) {
        return NextResponse.json({ error: 'Phone number is already in use by another account' }, { status: 400 });
      }
    }

    // 4. Update User fields
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      },
    });

    // 5. Update or Create Profile
    const dobValue = data.dob ? new Date(data.dob) : (user.profile?.dob || new Date('1990-01-01'));
    let profile;

    if (user.profile) {
      profile = await prisma.profile.update({
        where: { userId: session.userId },
        data: {
          fullName: data.fullName,
          dob: dobValue,
          ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 || '' }),
          ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 || '' }),
          ...(data.pincode !== undefined && { pincode: data.pincode || '' }),
          ...(data.city !== undefined && { city: data.city || '' }),
          ...(data.state !== undefined && { state: data.state || '' }),
        },
      });
    } else {
      // Create new profile with mock placeholders for required database constraints
      profile = await prisma.profile.create({
        data: {
          userId: session.userId,
          fullName: data.fullName,
          dob: dobValue,
          panNumber: `MOCKP${Math.floor(1000 + Math.random() * 9000)}P`,
          aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 0,
          employmentType: 'SALARIED',
          employmentDuration: 0,
          addressLine1: data.addressLine1 || 'Placeholder Address',
          addressLine2: data.addressLine2 || null,
          pincode: data.pincode || '000000',
          city: data.city || 'Placeholder City',
          state: data.state || 'Placeholder State',
          bankAccountNo: '0000000000',
          bankIfsc: 'ICIC0000000',
          bankName: 'Placeholder Bank',
        },
      });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'UPDATE_SETTINGS',
      entity: 'Profile',
      entityId: profile.id,
      oldValue: user.profile,
      newValue: profile,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile settings updated successfully',
      user: {
        id: user.id,
        phoneNumber: data.phoneNumber || user.phoneNumber,
        email: data.email || user.email,
        role: session.role,
        merchantStatus: user.merchantStatus,
        profile,
      },
    });
  } catch (error: any) {
    console.error('Error updating settings profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
