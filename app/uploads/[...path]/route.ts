import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, isMock, ensureBucketExists } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await context.params;
    const fileKey = pathSegments.join('/');
    
    if (isMock) {
      const localPath = path.join(process.cwd(), 'public', 'uploads', fileKey);
      if (!fs.existsSync(localPath)) {
        return new NextResponse('File Not Found', { status: 404 });
      }
      const buffer = fs.readFileSync(localPath);
      const ext = fileKey.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === 'pdf') contentType = 'application/pdf';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      
      return new NextResponse(new Uint8Array(buffer), {
        headers: { 'Content-Type': contentType },
      });
    } else {
      await ensureBucketExists();

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileKey,
      });

      const response = await s3Client!.send(command);

      if (!response.Body) {
        return new NextResponse('File Body Empty', { status: 404 });
      }

      // Convert stream to Buffer
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      };

      const buffer = await streamToBuffer(response.Body);
      
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': response.ContentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (error: any) {
    console.error('Error serving file:', error);
    return new NextResponse('File Not Found or Error serving file', { status: 404 });
  }
}
