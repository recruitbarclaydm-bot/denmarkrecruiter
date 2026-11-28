/**
 * Lightweight client-side HTML5 canvas image compression utility for mobile & low-bandwidth uploads.
 * Automatically resizes scans wider than 1800px (or 600px for avatars) and compresses to JPEG (quality 0.82).
 * Leaves PDF and non-image files untouched.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  reductionPercentage: number;
  badgeText?: string;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const compressImageFile = async (
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> => {
  const originalSize = file.size;

  // Leave non-image files (like PDFs) untouched
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      reductionPercentage: 0,
    };
  }

  const maxWidth = options?.maxWidth ?? 1800;
  const maxHeight = options?.maxHeight ?? 2400;
  const quality = options?.quality ?? 0.82;
  const mimeType = options?.mimeType ?? 'image/jpeg';

  return new Promise((resolve) => {
    // If running in an environment without DOM/Image support, return original
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
        reductionPercentage: 0,
      });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
        reductionPercentage: 0,
      });
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
          reductionPercentage: 0,
        });
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);
          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            wasCompressed: false,
            reductionPercentage: 0,
          });
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compression didn't reduce size (e.g. already small SVG/JPG), return original
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                wasCompressed: false,
                reductionPercentage: 0,
              });
              return;
            }

            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            const compressedSize = compressedFile.size;
            const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
            const badgeText = `Optimized ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (-${reduction}%)`;

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              wasCompressed: true,
              reductionPercentage: reduction,
              badgeText,
            });
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};
