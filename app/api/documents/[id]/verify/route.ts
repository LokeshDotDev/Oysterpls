import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role, VerificationStatus } from '@prisma/client';
import { sendNotification } from '@/lib/notification';
import { logAudit } from '@/lib/audit';

const verifySchema = z.object({
  status: z.enum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
  rejectionReason: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };
    const body = await req.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { status, rejectionReason } = result.data;

    // Check if the document exists
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document status
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedById: session.userId,
        verifiedAt: new Date(),
      },
    });

    // Record Document Audit
    await prisma.documentAudit.create({
      data: {
        documentId: id,
        action: status,
        performedBy: session.userId,
        details: status === 'REJECTED' ? `Rejected. Reason: ${rejectionReason}` : 'Verified successfully.',
      },
    });

    // Record General System Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: `DOCUMENT_${status}`,
      entity: 'Document',
      entityId: id,
      oldValue: { status: document.status, rejectionReason: document.rejectionReason },
      newValue: { status, rejectionReason },
      ipAddress,
    });

    // Send Notification to User
    const notificationContent = status === 'VERIFIED'
      ? `Your uploaded ${document.type} document has been verified successfully.`
      : `Your uploaded ${document.type} document was rejected. Reason: ${rejectionReason}. Please upload a clear document.`;

    await sendNotification({
      userId: document.profile.userId,
      channel: 'SMS',
      recipient: document.profile.user.phoneNumber,
      content: notificationContent,
    });

    return NextResponse.json({
      success: true,
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Error in document verification API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.OPERATIONS, Role.LOAN_OFFICER, Role.ADMIN, Role.SUPER_ADMIN]);
