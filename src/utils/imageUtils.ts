/**
 * Compress and resize an image for Gemini Vision OCR.
 * - Max 1600px on longest side (higher res = better OCR accuracy)
 * - JPEG quality 0.9 (high quality for text detection)
 * Returns a data URL.
 */
export function compressImage(
  dataUrl: string,
  maxDim = 3072,
  quality = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      let w = width;
      let h = height;

      // Scale down only if needed — don't upscale
      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          h = Math.round((h / w) * maxDim);
          w = maxDim;
        } else {
          w = Math.round((w / h) * maxDim);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      // White background before drawing (avoids transparency issues)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}
