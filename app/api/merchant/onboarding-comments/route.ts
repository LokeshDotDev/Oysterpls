import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';

// GET onboarding comments timeline (including audit logs)
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    let merchantId = session.userId;

    // Admin/Staff can specify a target merchantId
    if (session.role !== Role.MERCHANT) {
      const targetId = searchParams.get('merchantId');
      if (!targetId) {
        return NextResponse.json({ error: 'merchantId query parameter is required for staff' }, { status: 400 });
      }
      merchantId = targetId;
    }

    // Fetch onboarding comments (where applicationId is null)
    const comments = await prisma.comment.findMany({
      where: {
        applicationId: null,
        OR: [
          { senderId: merchantId },
          { receiverId: merchantId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch onboarding audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'User',
        entityId: merchantId,
        action: { in: ['APPROVE_MERCHANT', 'REJECT_MERCHANT', 'SUBMIT_ONBOARDING'] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format and combine into a unified timeline
    const timelineItems = [
      ...comments.map((c) => ({
        id: c.id,
        type: 'COMMENT',
        text: c.text,
        sender: {
          id: c.sender.id,
          name: c.sender.profile?.fullName || c.sender.email || c.sender.phoneNumber,
          role: c.sender.role,
        },
        createdAt: c.createdAt,
      })),
      ...auditLogs.map((a) => {
        let text = '';
        if (a.action === 'APPROVE_MERCHANT') {
          text = 'Merchant onboarding application has been APPROVED by the administrator.';
        } else if (a.action === 'REJECT_MERCHANT') {
          const reason = (a.newValue as any)?.rejectionReason || 'No reason provided';
          text = `Merchant onboarding application has been REJECTED by the administrator. Reason: ${reason}`;
        } else if (a.action === 'SUBMIT_ONBOARDING') {
          text = 'Merchant onboarding application has been SUBMITTED for review.';
        }

        return {
          id: a.id,
          type: 'AUDIT',
          text,
          sender: {
            id: a.userId || 'SYSTEM',
            name: a.user?.profile?.fullName || a.user?.email || 'System',
            role: a.user?.role || 'SYSTEM',
          },
          createdAt: a.createdAt,
        };
      }),
    ];

    // Sort timeline by date ascending
    timelineItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({ success: true, timeline: timelineItems });
  } catch (error: any) {
    console.error('Error fetching onboarding comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

// POST a new onboarding comment
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const { merchantId, text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    let finalMerchantId = session.userId;
    let isToAdmin = true;
    let isToMerchant = false;
    let receiverId: string | null = null;

    if (session.role !== Role.MERCHANT) {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required for staff comments' }, { status: 400 });
      }
      finalMerchantId = merchantId;
      isToAdmin = false;
      isToMerchant = true;
      receiverId = merchantId;
    }

    // Create the comment record
    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        senderId: session.userId,
        receiverId: receiverId,
        applicationId: null,
        isToAdmin,
        isToMerchant,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    // Notify the merchant if admin/staff commented
    if (session.role !== Role.MERCHANT) {
      const merchantUser = await prisma.user.findUnique({
        where: { id: finalMerchantId },
      });
      if (merchantUser) {
        await sendNotification({
          userId: finalMerchantId,
          channel: 'SMS',
          recipient: merchantUser.phoneNumber,
          subject: 'Onboarding Feedback',
          content: `Admin left a comment on your onboarding process: "${text.trim()}"`,
        });
      }
    } else {
      // Merchant commented, notify admin (log notification associated with merchant)
      const senderName = comment.sender.profile?.fullName || comment.sender.email || comment.sender.phoneNumber;
      await sendNotification({
        userId: session.userId,
        channel: 'SMS',
        recipient: comment.sender.phoneNumber || 'SYSTEM',
        subject: 'Onboarding Query for Admin',
        content: `Onboarding comment from ${senderName} (MERCHANT): "${text.trim()}"`,
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Error posting onboarding comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
