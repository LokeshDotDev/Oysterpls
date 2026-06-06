import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const isMockGoogle = !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('mock');
  return NextResponse.json({ isMockGoogle });
}
