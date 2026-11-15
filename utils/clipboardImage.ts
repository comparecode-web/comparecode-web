export type ClipboardImageResult =
  | { file: File; error: null }
  | { file: null; error: string };

export function getImageFileFromClipboardData(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

export function clipboardHasText(data: DataTransfer | null): boolean {
  return Boolean(data && Array.from(data.items).some((item) => item.kind === "string" && item.type === "text/plain"));
}

export async function readClipboardImage(): Promise<ClipboardImageResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
    return { file: null, error: "Your browser can't paste images with this button. Press Ctrl+V instead." };
  }
  let items: ClipboardItems;
  try {
    items = await navigator.clipboard.read();
  } catch {
    return { file: null, error: "Couldn't read the clipboard. Allow clipboard access or press Ctrl+V." };
  }
  for (const item of items) {
    const type = item.types.find((candidate) => candidate.startsWith("image/"));
    if (!type) continue;
    try {
      const blob = await item.getType(type);
      const extension = type.slice("image/".length).split("+")[0] || "png";
      return { file: new File([blob], `pasted-image.${extension}`, { type }), error: null };
    } catch {
      return { file: null, error: "Couldn't read the image from the clipboard." };
    }
  }
  return { file: null, error: "There is no image in the clipboard. Copy an image first." };
}
