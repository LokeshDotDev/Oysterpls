import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, isMock as isMockCloudinary } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // Read the body as an ArrayBuffer and convert it to a Buffer
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isMockCloudinary) {
      // Create the public/uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Write the buffer to the target file path
      const filePath = path.join(uploadDir, key);
      
      // Ensure parent subdirectories exist if key has slashes (e.g. profiles/user_id/pan.jpg)
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      console.log(`[Mock upload] Saved uploaded file to disk at: ${filePath}`);
    } else {
      await uploadToCloudinary(buffer, key);
      console.log(`[Cloudinary Upload Proxy] Successfully proxy uploaded file to Cloudinary: ${key}`);
    }

    return NextResponse.json({
      success: true,
      url: `/uploads/${key}`,
    });
  } catch (error: any) {
    console.error('Error in upload proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
