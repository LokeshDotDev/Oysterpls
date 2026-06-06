import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { optimizeImage } from '@/lib/image-optimizer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { DocumentType, Role, VerificationStatus } from '@prisma/client';
import { s3Client, isMock as isMockS3, ensureBucketExists } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const typeStr = formData.get('type') as string | null;
    const customerId = formData.get('customerId') as string | null;

    if (!file || !typeStr) {
      return NextResponse.json({ error: 'Missing file or type parameter' }, { status: 400 });
    }

    // Validate Document Type
    if (!Object.values(DocumentType).includes(typeStr as any)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }
    const type = typeStr as DocumentType;

    // Check permissions on customerId
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

    // Check if target profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete profile details first.' }, { status: 400 });
    }

    // 1. Optimize Image buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const { buffer: optimizedBuffer, contentType, ext } = await optimizeImage(originalBuffer, file.name);

    // 2. Determine file storage key
    const existingDoc = await prisma.document.findFirst({
      where: {
        profileId: profile.id,
        type: type,
      },
    });
    
    const version = existingDoc ? existingDoc.version + 1 : 1;
    const key = `profiles/${profile.id}/${type.toLowerCase()}_v${version}.${ext}`;

    // 3. Save to Storage (S3 or local uploads folder)
    if (isMockS3) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadDir, key);
      const fileDir = path.dirname(filePath);
      
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, optimizedBuffer);
      console.log(`[Document API] Saved optimized file locally: ${key} (${(optimizedBuffer.length/1024).toFixed(2)} KB)`);
    } else {
      await ensureBucketExists();
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: optimizedBuffer,
        ContentType: contentType,
      });
      await s3Client!.send(command);
      console.log(`[Document API] Saved optimized file to S3/MinIO: ${key} (${(optimizedBuffer.length/1024).toFixed(2)} KB)`);
    }

    // 4. Update or create Document entry in DB
    let document;
    const s3Url = key; // Save the key as relative path

    if (existingDoc) {
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          s3Url,
          version,
          status: VerificationStatus.PENDING,
          rejectionReason: null,
          verifiedById: null,
          verifiedAt: null,
        },
      });

      await prisma.documentAudit.create({
        data: {
          documentId: document.id,
          action: 'UPDATE',
          performedBy: session.userId,
          details: `Uploaded optimized version ${version}. File: ${file.name}. Size: ${(optimizedBuffer.length/1024).toFixed(2)} KB`,
        },
      });
    } else {
      document = await prisma.document.create({
        data: {
          profileId: profile.id,
          type: type,
          s3Url,
          version: 1,
          status: VerificationStatus.PENDING,
        },
      });

      await prisma.documentAudit.create({
        data: {
          documentId: document.id,
          action: 'UPLOAD',
          performedBy: session.userId,
          details: `Uploaded initial optimized version. File: ${file.name}. Size: ${(optimizedBuffer.length/1024).toFixed(2)} KB`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      document,
      url: `/uploads/${key}`,
    });
  } catch (error: any) {
    console.error('Error in document upload handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.CUSTOMER, Role.MERCHANT, Role.ADMIN, Role.SUPER_ADMIN]);
