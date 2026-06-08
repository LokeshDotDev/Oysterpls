import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const profileSchema = z.object({
  userId: z.string().optional(), // Used by Merchants to edit client profiles
  fullName: z.string().min(2),
  dob: z.string().transform((str) => new Date(str)),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card format'),
  aadhaarNumber: z.string().length(12, 'Aadhaar must be exactly 12 digits').regex(/^[0-9]+$/, 'Aadhaar must contain only numbers'),
  monthlyIncome: z.number().nonnegative().optional().default(0),
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED']).optional().default('SELF_EMPLOYED'),
  employmentDuration: z.number().int().nonnegative().optional().default(0),
  existingEmi: z.number().nonnegative().default(0),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits'),
  city: z.string().min(2),
  state: z.string().min(2),
  bankAccountNo: z.string().min(9).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  bankName: z.string().min(3),
  residenceStatus: z.string().optional(),
  reference1Name: z.string().optional(),
  reference1Mobile: z.string().optional(),
  reference2Name: z.string().optional(),
  reference2Mobile: z.string().optional(),
  addressProofType: z.string().optional(),
  cibilScore: z.number().optional(),
  shopName: z.string().min(2).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional(),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    
    // Determine the target user ID for the profile upsert
    let targetUserId = session.userId;
    if (session.role === Role.MERCHANT && data.userId && data.userId !== session.userId) {
      targetUserId = data.userId;
      
      // Ensure the target customer exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'Customer user not found' }, { status: 404 });
      }
    } else if (data.userId && data.userId !== session.userId) {
      // Non-merchants cannot update other people's profiles
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check unique constraints (PAN, Aadhaar) to prevent database exceptions
    const dupCheck = await prisma.profile.findFirst({
      where: {
        userId: { not: targetUserId },
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
      if (dupCheck.aadhaarNumber === data.aadhaarNumber) {
        return NextResponse.json({ error: 'Aadhaar number is already registered to another account' }, { status: 400 });
      }
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
    });

    // Upsert Profile
    const profile = await prisma.profile.upsert({
      where: { userId: targetUserId },
      update: {
        fullName: data.fullName,
        dob: data.dob,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        monthlyIncome: data.monthlyIncome,
        employmentType: data.employmentType,
        employmentDuration: data.employmentDuration,
        existingEmi: data.existingEmi,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        bankAccountNo: data.bankAccountNo,
        bankIfsc: data.bankIfsc,
        bankName: data.bankName,
        residenceStatus: data.residenceStatus,
        reference1Name: data.reference1Name,
        reference1Mobile: data.reference1Mobile,
        reference2Name: data.reference2Name,
        reference2Mobile: data.reference2Mobile,
        addressProofType: data.addressProofType,
        shopName: data.shopName,
        gstNumber: data.gstNumber,
        ...(data.cibilScore !== undefined && { cibilScore: data.cibilScore }),
      },
      create: {
        userId: targetUserId,
        fullName: data.fullName,
        dob: data.dob,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        monthlyIncome: data.monthlyIncome,
        employmentType: data.employmentType,
        employmentDuration: data.employmentDuration,
        existingEmi: data.existingEmi,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        bankAccountNo: data.bankAccountNo,
        bankIfsc: data.bankIfsc,
        bankName: data.bankName,
        residenceStatus: data.residenceStatus,
        reference1Name: data.reference1Name,
        reference1Mobile: data.reference1Mobile,
        reference2Name: data.reference2Name,
        reference2Mobile: data.reference2Mobile,
        addressProofType: data.addressProofType,
        shopName: data.shopName,
        gstNumber: data.gstNumber,
        cibilScore: data.cibilScore || null,
      },
    });

    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: existingProfile ? 'UPDATE_PROFILE' : 'CREATE_PROFILE',
      entity: 'Profile',
      entityId: profile.id,
      oldValue: existingProfile,
      newValue: profile,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error in profile upsert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.CUSTOMER, Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);

// GET route to retrieve profile details
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId') || session.userId;

    // Merchants, Admins, and Officers can read other profiles
    if (userId !== session.userId) {
      if (
        session.role !== Role.MERCHANT &&
        session.role !== Role.LOAN_OFFICER &&
        session.role !== Role.OPERATIONS &&
        session.role !== Role.ADMIN &&
        session.role !== Role.SUPER_ADMIN
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        documents: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
