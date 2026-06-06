import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';

const noteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  isInternal: z.boolean().default(true),
});

export const POST = withAuth(async (req: NextRequest, session, context) => {
  try {
    const { id } = await context.params as { id: string };
    const body = await req.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { content, isInternal } = result.data;

    // Check if application exists
    const application = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create note
    const note = await prisma.note.create({
      data: {
        applicationId: id,
        authorId: session.userId,
        content,
        isInternal,
      },
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.LOAN_OFFICER, Role.OPERATIONS, Role.FINANCE, Role.COLLECTIONS, Role.ADMIN, Role.SUPER_ADMIN]);
