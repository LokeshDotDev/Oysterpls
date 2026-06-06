import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const isMock = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.startsWith('mock');
const minioEndpoint = process.env.MINIO_ENDPOINT;

export const s3Client = isMock
  ? null
  : new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: minioEndpoint || undefined,
      forcePathStyle: !!minioEndpoint, // Required for MinIO local path style routing
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

let bucketVerified = false;

export async function ensureBucketExists(): Promise<void> {
  if (isMock || !s3Client || bucketVerified) return;
  const bucketName = process.env.AWS_S3_BUCKET || 'lending-documents';
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`[S3/MinIO] Bucket "${bucketName}" verified.`);
    bucketVerified = true;
  } catch (error: any) {
    // If bucket doesn't exist, create it
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`[S3/MinIO] Bucket "${bucketName}" not found. Initializing...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`[S3/MinIO] Bucket "${bucketName}" created successfully.`);
        bucketVerified = true;
      } catch (createErr) {
        console.error(`[S3/MinIO] Failed to create bucket "${bucketName}":`, createErr);
        throw createErr;
      }
    } else {
      console.error(`[S3/MinIO] Error checking bucket status:`, error);
      throw error;
    }
  }
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  if (isMock) {
    // Return local mock API endpoint for client file uploads
    return `/api/documents/mock-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
  }

  await ensureBucketExists();

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  // Expires in 15 minutes (900 seconds)
  return getSignedUrl(s3Client!, command, { expiresIn: 900 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  if (isMock) {
    // Return local upload folder path
    return `/uploads/${key}`;
  }

  await ensureBucketExists();

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return getSignedUrl(s3Client!, command, { expiresIn: 900 });
}

