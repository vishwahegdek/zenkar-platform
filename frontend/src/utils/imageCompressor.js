/**
 * Mobile-first client-side image downsizing utility.
 * Pre-downsizes large smartphone camera photos (3-12 MB) before uploading over cellular/Wi-Fi,
 * reducing upload time and preventing network bottlenecks while preserving crisp quality.
 */
export async function compressImageForUpload(file, maxDimension = 2048, quality = 0.88) {
  // If not in browser, not an image, or already under 1 MB, return original
  if (typeof window === 'undefined' || !file || !file.type?.startsWith('image/')) {
    return file;
  }

  // If already under 1MB, no need for client-side compression
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          let { width, height } = img;

          // Don't upscale smaller images
          if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
            resolve(file);
            return;
          }

          // Calculate aspect ratio bounded to maxDimension
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use JPEG for camera photos; preserve png if original had transparency
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File([blob], file.name, {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            outputType,
            quality,
          );
        } catch {
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

