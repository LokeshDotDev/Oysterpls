import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: {
          include: {
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Failed to fetch system users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS, Role.LOAN_OFFICER, Role.FINANCE]);
