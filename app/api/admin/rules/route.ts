import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const ruleUpdateSchema = z.object({
  name: z.string(),
  value: z.any(),
  description: z.string().optional(),
});

// GET all rules - open to all authenticated internal roles
export const GET = withAuth(async () => {
  try {
    const rules = await prisma.eligibilityRule.findMany();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Failed to get rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.LOAN_OFFICER, Role.OPERATIONS, Role.FINANCE, Role.COLLECTIONS, Role.ADMIN, Role.SUPER_ADMIN]);

// POST update a rule - Admin only
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = ruleUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, value, description } = result.data;

    const existingRule = await prisma.eligibilityRule.findUnique({
      where: { name },
    });

    if (!existingRule) {
      return NextResponse.json({ error: `Rule with name ${name} not found` }, { status: 404 });
    }

    const updatedRule = await prisma.eligibilityRule.update({
      where: { name },
      data: {
        value,
        ...(description !== undefined && { description }),
        updatedById: session.userId,
      },
    });

    // Record system audit log
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    await logAudit({
      userId: session.userId,
      action: 'UPDATE_ELIGIBILITY_RULE',
      entity: 'EligibilityRule',
      entityId: existingRule.id,
      oldValue: { value: existingRule.value, description: existingRule.description },
      newValue: { value, description },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      rule: updatedRule,
    });
  } catch (error: any) {
    console.error('Failed to update rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
