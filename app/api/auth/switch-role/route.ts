import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession, signToken } from '@/lib/auth';
import { Role } from '@prisma/client';
import prisma from '@/lib/db';

const switchRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      // Fallback: If no session, bind to the seeded user of that role
      const body = await req.json();
      const result = switchRoleSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
      }
      const { role } = result.data;
      
      const seededUser = await prisma.user.findFirst({
        where: { role },
      });
      
      if (!seededUser) {
        return NextResponse.json({ error: `No seeded user found for role ${role}` }, { status: 400 });
      }
      
      const token = signToken({ userId: seededUser.id, role });
      const response = NextResponse.json({ success: true, role, user: seededUser });
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    }

    const body = await req.json();
    const result = switchRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { role } = result.data;

    // Update the role in the database to align user roles
    await prisma.user.update({
      where: { id: session.userId },
      data: { role },
    });

    // Generate new token with updated role
    const token = signToken({ userId: session.userId, role });

    const response = NextResponse.json({
      success: true,
      role,
      userId: session.userId,
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Failed to switch role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
