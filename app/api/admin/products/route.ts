import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { Role } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  description: z.string().optional(),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  interestRate: z.number().nonnegative(),
  interestType: z.enum(['FLAT', 'REDUCING']),
  minTenure: z.number().int().positive(),
  maxTenure: z.number().int().positive(),
  processingFee: z.number().nonnegative(),
  lateFeeRate: z.number().nonnegative(),
  bounceCharge: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  downPaymentRate: z.number().nonnegative().optional(),
  dbdRate: z.number().nonnegative().optional(),
  supportedFrequencies: z.array(z.string()).optional(),
  insurancePlans: z.array(z.object({
    name: z.string(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
    value: z.number().nonnegative()
  })).optional(),
});

// GET all active/inactive loan products
export const GET = async (req: NextRequest) => {
  try {
    const products = await prisma.loanProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

// POST create or update a loan product (Admin-only)
export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

    if (data.id) {
      // UPDATE Product
      const existingProduct = await prisma.loanProduct.findUnique({
        where: { id: data.id },
      });

      if (!existingProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const updatedProduct = await prisma.loanProduct.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          interestRate: data.interestRate,
          interestType: data.interestType,
          minTenure: data.minTenure,
          maxTenure: data.maxTenure,
          processingFee: data.processingFee,
          lateFeeRate: data.lateFeeRate,
          bounceCharge: data.bounceCharge,
          isActive: data.isActive,
          downPaymentRate: data.downPaymentRate,
          dbdRate: data.dbdRate,
          supportedFrequencies: data.supportedFrequencies ? JSON.parse(JSON.stringify(data.supportedFrequencies)) : undefined,
          insurancePlans: data.insurancePlans ? JSON.parse(JSON.stringify(data.insurancePlans)) : undefined,
        },
      });

      await logAudit({
        userId: session.userId,
        action: 'UPDATE_LOAN_PRODUCT',
        entity: 'LoanProduct',
        entityId: existingProduct.id,
        oldValue: existingProduct,
        newValue: updatedProduct,
        ipAddress,
      });

      return NextResponse.json({ success: true, product: updatedProduct });
    } else {
      // CREATE Product
      const existingName = await prisma.loanProduct.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        return NextResponse.json({ error: 'A product with this name already exists' }, { status: 400 });
      }

      const newProduct = await prisma.loanProduct.create({
        data: {
          name: data.name,
          description: data.description,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          interestRate: data.interestRate,
          interestType: data.interestType,
          minTenure: data.minTenure,
          maxTenure: data.maxTenure,
          processingFee: data.processingFee,
          lateFeeRate: data.lateFeeRate,
          bounceCharge: data.bounceCharge,
          isActive: data.isActive,
          downPaymentRate: data.downPaymentRate ?? 20.00,
          dbdRate: data.dbdRate ?? 2.00,
          supportedFrequencies: data.supportedFrequencies ? JSON.parse(JSON.stringify(data.supportedFrequencies)) : ['MONTHLY'],
          insurancePlans: data.insurancePlans ? JSON.parse(JSON.stringify(data.insurancePlans)) : [],
        },
      });

      await logAudit({
        userId: session.userId,
        action: 'CREATE_LOAN_PRODUCT',
        entity: 'LoanProduct',
        entityId: newProduct.id,
        newValue: newProduct,
        ipAddress,
      });

      return NextResponse.json({ success: true, product: newProduct });
    }
  } catch (error: any) {
    console.error('Failed to create/update product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, [Role.ADMIN, Role.SUPER_ADMIN]);
