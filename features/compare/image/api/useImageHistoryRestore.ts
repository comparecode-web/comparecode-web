import { useCallback } from "react";
import { DiffHistoryItem } from "@/types/history";
import { useImageCompareStore, type ImageFileMeta } from "@/features/compare/image/store/useImageCompareStore";

function inferImageType(url: string): string {
  if (url.startsWith("data:image/")) {
    const end = url.indexOf(";");
    if (end > 5) {
      return url.slice(5, end);
    }
  }

  const normalized = url.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".bmp")) return "image/bmp";
  if (normalized.endsWith(".avif")) return "image/avif";
  return "image/*";
}

function toRestoredImageMeta(
  url: string,
  name: string,
  width: number,
  height: number
): ImageFileMeta {
  return {
    name,
    size: 0,
    type: inferImageType(url),
    lastModified: Date.now(),
    width,
    height,
    url,
    exif: null
  };
}

export function useImageHistoryRestore() {
  const setOriginalImage = useImageCompareStore((state) => state.setOriginalImage);
  const setModifiedImage = useImageCompareStore((state) => state.setModifiedImage);
  const setCompareMode = useImageCompareStore((state) => state.setCompareMode);
  const setIsMetadataPanelOpen = useImageCompareStore((state) => state.setIsMetadataPanelOpen);

  const restoreImageHistoryItem = useCallback((item: DiffHistoryItem): boolean => {
    if (item.snapshot?.mode !== "image") {
      return false;
    }

    const snapshot = item.snapshot;
    const originalImageUrl = snapshot.originalImageDataUrl || snapshot.originalImageUrl;
    const modifiedImageUrl = snapshot.modifiedImageDataUrl || snapshot.modifiedImageUrl;

    setOriginalImage(toRestoredImageMeta(
      originalImageUrl,
      snapshot.originalImageName ?? "Original image",
      snapshot.originalImageWidth ?? 0,
      snapshot.originalImageHeight ?? 0
    ));

    setModifiedImage(toRestoredImageMeta(
      modifiedImageUrl,
      snapshot.modifiedImageName ?? "Modified image",
      snapshot.modifiedImageWidth ?? 0,
      snapshot.modifiedImageHeight ?? 0
    ));

    setCompareMode("side-by-side");
    setIsMetadataPanelOpen(false);

    return true;
  }, [setCompareMode, setIsMetadataPanelOpen, setModifiedImage, setOriginalImage]);

  return { restoreImageHistoryItem };
}
