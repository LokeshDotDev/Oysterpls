import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { optimizeImage } from '@/lib/image-optimizer';
import { LoanStatus, VerificationStatus } from '@prisma/client';
import { uploadToCloudinary, isMock as isMockCloudinary } from '@/lib/cloudinary';
import { createRazorpayCustomer, setupRazorpayMandate } from '@/lib/razorpay';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest, context: any) {
  try {
    const { id } = await context.params as { id: string };
    
    // Parse form data since we will receive files (Selfie and Signature)
    const formData = await req.formData();
    const panNumber = formData.get('panNumber') as string | null;
    const selfieFile = formData.get('selfie') as File | null;
    const signatureFile = formData.get('signature') as File | null;

    if (!panNumber || !selfieFile || !signatureFile) {
      return NextResponse.json({ error: 'Missing panNumber, selfie, or signature file' }, { status: 400 });
    }

    // Fetch the loan application
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Loan application not found' }, { status: 404 });
    }

    const profile = application.customer.profile;
    if (!profile) {
      return NextResponse.json({ error: 'Customer profile details not found' }, { status: 400 });
    }

    // Verify PAN card number matches profile
    if (profile.panNumber.toUpperCase() !== panNumber.trim().toUpperCase()) {
      return NextResponse.json({ error: 'PAN card number does not match customer records' }, { status: 400 });
    }

    // 1. Optimize Selfie
    const selfieArrayBuffer = await selfieFile.arrayBuffer();
    const selfieBufferOriginal = Buffer.from(selfieArrayBuffer);
    const { buffer: selfieBuffer, ext: selfieExt } = await optimizeImage(selfieBufferOriginal, `selfie_${id}.jpg`);
    const selfieKey = `profiles/${profile.id}/selfie_esign_${Date.now()}.${selfieExt}`;

    // 2. Optimize Signature
    const sigArrayBuffer = await signatureFile.arrayBuffer();
    const sigBufferOriginal = Buffer.from(sigArrayBuffer);
    const { buffer: sigBuffer, ext: sigExt } = await optimizeImage(sigBufferOriginal, `signature_${id}.jpg`);
    const sigKey = `profiles/${profile.id}/signature_esign_${Date.now()}.${sigExt}`;

    // 3. Save files to storage
    if (isMockCloudinary) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      const selfiePath = path.join(uploadDir, selfieKey);
      fs.mkdirSync(path.dirname(selfiePath), { recursive: true });
      fs.writeFileSync(selfiePath, selfieBuffer);

      const sigPath = path.join(uploadDir, sigKey);
      fs.mkdirSync(path.dirname(sigPath), { recursive: true });
      fs.writeFileSync(sigPath, sigBuffer);
      
      console.log(`[E-Sign] Saved optimized selfie and signature locally for application ${id}`);
    } else {
      // Selfie Cloudinary
      await uploadToCloudinary(selfieBuffer, selfieKey, 'image/webp');

      // Signature Cloudinary
      await uploadToCloudinary(sigBuffer, sigKey, 'image/webp');
      console.log(`[E-Sign] Saved optimized selfie and signature to Cloudinary for application ${id}`);
    }

    // 4. Save Selfie & Signature documents in Document Registry
    await prisma.document.createMany({
      data: [
        {
          profileId: profile.id,
          type: 'SELFIE',
          s3Url: selfieKey,
          status: VerificationStatus.VERIFIED, // Pre-verified via live capture
        },
        {
          profileId: profile.id,
          type: 'AGREEMENT',
          s3Url: sigKey,
          status: VerificationStatus.VERIFIED, // Pre-verified via agreement sign
        }
      ]
    });

    // 5. Update loan application
    const updatedApp = await prisma.loanApplication.update({
      where: { id },
      data: {
        loanAgreementSigned: true,
        selfieUrl: selfieKey,
        signatureUrl: sigKey,
        status: LoanStatus.MANDATE_PENDING, // Transition to mandate pending
      },
    });

    console.log(`[E-Sign] Customer e-signed application ${id}. Creating Razorpay Customer & Mandate...`);

    // Setup Razorpay Customer & Mandate
    let authUrl = `/dashboard`;
    try {
      const rzpCustomerId = await createRazorpayCustomer(
        profile.fullName,
        application.customer.email || 'customer@lending.com',
        application.customer.phoneNumber
      );

      const requestedAmount = Number(application.requestedAmount);
      const mandateSetup = await setupRazorpayMandate(
        application.id,
        rzpCustomerId,
        requestedAmount
      );
      
      authUrl = mandateSetup.authUrl;

      // Upsert Mandate row in DB
      await prisma.mandate.upsert({
        where: { applicationId: application.id },
        update: {
          razorpayMandateId: mandateSetup.mandateId,
          status: 'PENDING',
          authUrl: mandateSetup.authUrl,
        },
        create: {
          applicationId: application.id,
          razorpayMandateId: mandateSetup.mandateId,
          status: 'PENDING',
          authUrl: mandateSetup.authUrl,
        },
      });

      console.log(`[E-Sign] Mandate setup successfully created. Auth URL: ${authUrl}`);
    } catch (mandateError) {
      console.error('Failed to auto-create Razorpay mandate during e-sign:', mandateError);
    }

    return NextResponse.json({
      success: true,
      application: updatedApp,
      authUrl,
    });
  } catch (error: any) {
    console.error('Error during customer e-sign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
