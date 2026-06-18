import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { sendNotification } from '@/lib/notification';

const commentSchema = z.object({
  applicationId: z.string().optional(),
  text: z.string().min(1, 'Message cannot be empty'),
  receiverId: z.string().optional(),
  isToAdmin: z.boolean().default(false),
  isToMerchant: z.boolean().default(false),
});

// GET comments for a specific application or all comments for current user role
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    let whereClause: any = {};

    if (applicationId) {
      // Verify application existence & permissions
      const application = await prisma.loanApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Check application permissions
      if (session.role === Role.CUSTOMER && application.customerId !== session.userId) {
        return NextResponse.json({ error: 'Unauthorized access to application' }, { status: 403 });
      }
      if (session.role === Role.MERCHANT && application.merchantId !== session.userId) {
        return NextResponse.json({ error: 'Unauthorized access to application' }, { status: 403 });
      }

      whereClause.applicationId = applicationId;
    } else {
      // Role-based scoping for messaging feed
      if (session.role === Role.CUSTOMER) {
        whereClause.application = { customerId: session.userId };
      } else if (session.role === Role.MERCHANT) {
        whereClause.application = { merchantId: session.userId };
      }
      // ADMIN/SUPER_ADMIN sees all comments
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            productName: true,
            customer: {
              select: {
                id: true,
                profile: { select: { fullName: true } },
              },
            },
            merchant: {
              select: {
                id: true,
                profile: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Apply visibility filters based on roles
    let visibleComments = comments;

    if (session.role === Role.CUSTOMER || session.role === Role.MERCHANT) {
      // Customers and Merchants only see comments where they are the sender or the receiver
      visibleComments = comments.filter(c => {
        return c.senderId === session.userId || c.receiverId === session.userId;
      });
    }

    return NextResponse.json({ success: true, comments: visibleComments });
  } catch (error: any) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

// POST a new comment
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { applicationId, text, receiverId, isToAdmin, isToMerchant } = result.data;

    // Fetch the application
    let application = null;
    if (applicationId) {
      application = await prisma.loanApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
    }

    // Validate security rules for message routing
    let finalReceiverId = receiverId || null;

    if (session.role === Role.CUSTOMER) {
      // Customer can only communicate with their Merchant
      if (application) {
        if (!application.merchantId) {
          return NextResponse.json({ error: 'No merchant linked to this application' }, { status: 400 });
        }
        finalReceiverId = application.merchantId;
      }
      if (isToAdmin) {
        return NextResponse.json({ error: 'Customers cannot communicate directly with Admin' }, { status: 403 });
      }
    } else if (session.role === Role.MERCHANT) {
      // Merchant can talk to customer (receiverId = customer) or admin (isToAdmin = true)
      if (isToAdmin) {
        finalReceiverId = null; // Broadcast or directed to admin desk
      } else if (application) {
        finalReceiverId = application.customerId;
      }
    } else {
      // Admin can talk to anyone
      if (!finalReceiverId && application) {
        // Default to customer
        finalReceiverId = application.customerId;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        applicationId: applicationId || null,
        text,
        senderId: session.userId,
        receiverId: finalReceiverId,
        isToAdmin: session.role === Role.CUSTOMER ? false : isToAdmin,
        isToMerchant: session.role === Role.CUSTOMER ? true : isToMerchant,
      },
      include: {
        sender: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            role: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    // Notify the receiver in real-time
    if (finalReceiverId) {
      const receiverUser = await prisma.user.findUnique({
        where: { id: finalReceiverId },
      });
      if (receiverUser) {
        const shortAppId = applicationId ? ` on Application (ID: ${applicationId.substring(0, 8)})` : ' on Onboarding';
        const senderName = comment.sender.profile?.fullName || comment.sender.email || comment.sender.phoneNumber;
        
        await sendNotification({
          userId: finalReceiverId,
          channel: 'SMS',
          recipient: receiverUser.phoneNumber,
          subject: 'New Message Recieved',
          content: `New comment from ${senderName} (${session.role})${shortAppId}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        });
      }
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
