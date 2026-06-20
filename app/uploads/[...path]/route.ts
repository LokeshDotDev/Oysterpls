import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryUrl, isMock as isMockCloudinary } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await context.params;
    const fileKey = pathSegments.join('/');
    
    if (isMockCloudinary) {
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
      const secureUrl = getCloudinaryUrl(fileKey);
      console.log(`[Uploads Proxy] Redirecting ${fileKey} request to Cloudinary: ${secureUrl}`);
      return NextResponse.redirect(secureUrl);
    }
  } catch (error: any) {
    console.error('Error serving file:', error);
    return new NextResponse('File Not Found or Error serving file', { status: 404 });
  }
}
