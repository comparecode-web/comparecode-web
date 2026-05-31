export async function createImageThumbnailDataUrl(
  imageUrl: string,
  width: number,
  height: number,
  quality = 0.82
): Promise<string> {
  if (!imageUrl || width <= 0 || height <= 0) {
    return "";
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        resolve("");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, width, height);

      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));
      const offsetX = Math.floor((width - targetWidth) / 2);
      const offsetY = Math.floor((height - targetHeight) / 2);

      ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => resolve("");
    img.src = imageUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(blob);
  });
}

export async function createImageDataUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) {
    return "";
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return "";
    }

    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch {
    return "";
  }
}
