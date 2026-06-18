import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    // 1. Fetch system-wide notifications (for all users)
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    // 2. Fetch system audit logs for operations tracking
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return NextResponse.json({
      success: true,
      notifications,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Failed to fetch admin notifications / audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS, Role.LOAN_OFFICER, Role.FINANCE]);
