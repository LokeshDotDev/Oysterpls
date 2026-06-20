import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { optimizeImage } from '@/lib/image-optimizer';
import { uploadToCloudinary, isMock as isMockCloudinary } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    // 1. Optimize Image buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const { buffer: optimizedBuffer, contentType, ext } = await optimizeImage(originalBuffer, file.name);

    // 2. Storage key
    const key = `avatars/${session.userId}.${ext}`;

    // 3. Save to Storage (Cloudinary or local uploads folder)
    if (isMockCloudinary) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadDir, key);
      const fileDir = path.dirname(filePath);
      
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, optimizedBuffer);
      console.log(`[Avatar API] Saved optimized avatar locally: ${key}`);
    } else {
      await uploadToCloudinary(optimizedBuffer, key, contentType);
      console.log(`[Avatar API] Saved optimized avatar to Cloudinary: ${key}`);
    }

    // 4. Update User entry in DB
    const relativeUrl = `/uploads/${key}`;
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        profilePictureUrl: relativeUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: relativeUrl,
    });
  } catch (error: any) {
    console.error('Error in upload-avatar handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
