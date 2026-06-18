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

export const PATCH = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const { userId, isBanned, password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow Admin or Super Admin to update user credentials/status
    if (session.role !== Role.ADMIN && session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Insufficient privileges' }, { status: 403 });
    }

    const updateData: any = {};
    if (typeof isBanned === 'boolean') {
      updateData.isBanned = isBanned;
    }
    if (password !== undefined) {
      updateData.password = password;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Record Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    const oldValue: any = {};
    const newValue: any = {};
    if (typeof isBanned === 'boolean') {
      oldValue.isBanned = user.isBanned;
      newValue.isBanned = isBanned;
    }
    if (password !== undefined) {
      oldValue.password = '***';
      newValue.password = '***';
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'ADMIN_UPDATE_USER',
        entity: 'User',
        entityId: userId,
        oldValue,
        newValue,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
