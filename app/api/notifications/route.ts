import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    let notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    // If no notifications exist, seed some understandable, role-specific notifications
    if (notifications.length === 0) {
      const role = session.role;
      let seedData = [];

      if (role === 'CUSTOMER') {
        seedData = [
          {
            channel: 'SMS',
            recipient: session.userId,
            subject: 'Welcome to Oysterpls',
            content: 'Welcome to Oysterpls! Your customer portal is now active. You can track your active loan and check your repayments here.',
            status: 'SENT',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          },
          {
            channel: 'SMS',
            recipient: session.userId,
            subject: 'Security Notice',
            content: 'Security Alert: Never share your OTP, PAN details, or live selfie link with anyone. Keep your account secure.',
            status: 'SENT',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          }
        ];
      } else if (role === 'MERCHANT') {
        seedData = [
          {
            channel: 'SMS',
            recipient: session.userId,
            subject: 'Store Console Activated',
            content: 'Welcome to the Oysterpls Store Console! Complete your merchant onboarding profile to start submitting customer loan applications.',
            status: 'SENT',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            channel: 'SMS',
            recipient: session.userId,
            subject: 'Onboarding Instructions',
            content: 'Onboarding Tip: Please ensure high-resolution scans of your PAN card, Aadhaar card, and a clear selfie are uploaded to ensure quick admin approval.',
            status: 'SENT',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          }
        ];
      } else {
        seedData = [
          {
            channel: 'EMAIL',
            recipient: session.userId,
            subject: 'Console Access Granted',
            content: `Welcome to the Oysterpls Administration Console. Your access role is set as ${role}. You can now manage loans, rules, and store approvals.`,
            status: 'SENT',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            channel: 'EMAIL',
            recipient: session.userId,
            subject: 'Underwriting Reminder',
            content: 'Staff Alert: Please verify GSTIN registry entries and matched bank details carefully before approving merchant settlement accounts.',
            status: 'SENT',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          }
        ];
      }

      await prisma.notification.createMany({
        data: seedData.map(d => ({
          ...d,
          userId: session.userId,
        }))
      });

      notifications = await prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

export const PUT = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: session.userId,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
