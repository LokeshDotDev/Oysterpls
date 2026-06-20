import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { getPresignedUploadUrl } from '@/lib/cloudinary';
import { DocumentType, Role } from '@prisma/client';

const uploadRequestSchema = z.object({
  type: z.nativeEnum(DocumentType),
  filename: z.string().min(1),
  customerId: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = uploadRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { type, filename, customerId } = result.data;

    let targetUserId = session.userId;
    if (customerId) {
      if (
        session.role !== Role.MERCHANT &&
        session.role !== Role.ADMIN &&
        session.role !== Role.SUPER_ADMIN
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      targetUserId = customerId;
    }

    // Check if the user has a profile
    const profile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete your profile before uploading documents.' }, { status: 400 });
    }

    // Check if a document of this type already exists for this profile
    const existingDoc = await prisma.document.findFirst({
      where: {
        profileId: profile.id,
        type: type,
      },
    });

    const fileExtension = filename.split('.').pop() || '';
    const key = `profiles/${profile.id}/${type.toLowerCase()}_v${existingDoc ? existingDoc.version + 1 : 1}.${fileExtension}`;
    
    // Generate S3 Upload URL (or local mock URL)
    const presignedUrl = await getPresignedUploadUrl(key, `image/${fileExtension === 'pdf' ? 'pdf' : fileExtension === 'png' ? 'png' : 'jpeg'}`);

    let document;
    if (existingDoc) {
      // Update existing document: increment version, change URL, reset verification status
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          s3Url: key,
          version: existingDoc.version + 1,
          status: 'PENDING',
          rejectionReason: null,
          verifiedById: null,
          verifiedAt: null,
        },
      });

      // Record Audit Trail
      await prisma.documentAudit.create({
        data: {
          documentId: document.id,
          action: 'UPDATE',
          performedBy: session.userId,
          details: `Updated document to version ${document.version}. Key: ${key}`,
        },
      });
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          profileId: profile.id,
          type: type,
          s3Url: key,
          version: 1,
          status: 'PENDING',
        },
      });

      // Record Audit Trail
      await prisma.documentAudit.create({
        data: {
          documentId: document.id,
          action: 'UPLOAD',
          performedBy: session.userId,
          details: `Uploaded initial version. Key: ${key}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      document,
      presignedUrl,
    });
  } catch (error: any) {
    console.error('Error in document upload request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
