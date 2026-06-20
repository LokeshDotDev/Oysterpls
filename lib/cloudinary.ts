import { v2 as cloudinary } from 'cloudinary';

export const isMock = !process.env.CLOUDINARY_URL || process.env.CLOUDINARY_URL.includes('mock') || process.env.CLOUDINARY_URL.includes('<your_api_secret>');

if (!isMock) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
}

/**
 * Uploads a file buffer to Cloudinary.
 * @param buffer File buffer
 * @param key File key path (e.g., profiles/123/pan_v1.jpg)
 * @param contentType Content type of the file
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  key: string,
  contentType?: string
): Promise<any> {
  if (isMock) {
    throw new Error('[Cloudinary] Cannot upload to Cloudinary in mock mode.');
  }

  // Parse public ID and format from the key
  const lastDotIndex = key.lastIndexOf('.');
  const publicId = lastDotIndex !== -1 ? key.substring(0, lastDotIndex) : key;
  const format = lastDotIndex !== -1 ? key.substring(lastDotIndex + 1) : undefined;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'auto',
    };
    
    if (format) {
      uploadOptions.format = format;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload failed for key:', key, error);
          reject(error);
        } else {
          console.log('[Cloudinary] Upload successful for key:', key, result?.secure_url);
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Helper to get the secure Cloudinary delivery URL for a key.
 */
export function getCloudinaryUrl(key: string): string {
  if (isMock) {
    return `/uploads/${key}`;
  }

  const lastDotIndex = key.lastIndexOf('.');
  const publicId = lastDotIndex !== -1 ? key.substring(0, lastDotIndex) : key;
  const format = lastDotIndex !== -1 ? key.substring(lastDotIndex + 1) : undefined;

  // Build secure url: cloudinary.url expects publicId and options.
  // We can pass format in the options.
  return cloudinary.url(publicId, {
    secure: true,
    format: format,
    analytics: false,
  });
}

/**
 * Expose compatible signature for direct client uploads.
 * In Cloudinary mode, we upload via the local mock-upload endpoint acting as a proxy.
 */
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  return `/api/documents/mock-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  return `/uploads/${key}`;
}
