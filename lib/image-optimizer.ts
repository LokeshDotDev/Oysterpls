import sharp from 'sharp';

interface OptimizationResult {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

export async function optimizeImage(
  buffer: Buffer,
  filename: string
): Promise<OptimizationResult> {
  const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

  // Non-image check (like PDF, TXT, etc.)
  if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
    console.log(`[Image Optimizer] Bypassing optimization for document: ${filename}`);
    return {
      buffer,
      contentType: fileExtension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
      ext: fileExtension,
    };
  }

  try {
    console.log(`[Image Optimizer] Compressing image: ${filename}. Original size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    // Resize image if it exceeds reasonable dimensions (1200px max width/height)
    // Convert to webp with 75% quality for a very small file footprint with unnoticeable visual change
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 70, effort: 6 })
      .toBuffer();

    console.log(`[Image Optimizer] Compression completed. Optimized size: ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);

    return {
      buffer: optimizedBuffer,
      contentType: 'image/webp',
      ext: 'webp',
    };
  } catch (error) {
    console.error('[Image Optimizer] Error during optimization, falling back to original file:', error);
    // Fallback to original buffer
    let contentType = 'image/jpeg';
    if (fileExtension === 'png') contentType = 'image/png';
    else if (fileExtension === 'webp') contentType = 'image/webp';
    
    return {
      buffer,
      contentType,
      ext: fileExtension,
    };
  }
}
