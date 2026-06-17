import { useCallback, useRef } from "react";
import { HistoryService } from "@/services/historyService";
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
  type: string,
  size: number,
  width: number,
  height: number
): ImageFileMeta {
  return {
    name,
    size,
    type,
    lastModified: Date.now(),
    width,
    height,
    url,
    exif: null
  };
}

function normalizeKnownSize(size: number | undefined): number | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return null;
  }

  return size;
}

async function resolveImageSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return blob.size > 0 ? blob.size : null;
  } catch {
    return null;
  }
}

export function useImageHistoryRestore() {
  const setOriginalImage = useImageCompareStore((state) => state.setOriginalImage);
  const setModifiedImage = useImageCompareStore((state) => state.setModifiedImage);
  const setCompareMode = useImageCompareStore((state) => state.setCompareMode);
  const setIsMetadataPanelOpen = useImageCompareStore((state) => state.setIsMetadataPanelOpen);
  const restoreAlignmentTransform = useImageCompareStore((state) => state.restoreAlignmentTransform);
  const restoreRequestIdRef = useRef(0);

  const restoreImageHistoryItem = useCallback((item: DiffHistoryItem): boolean => {
    if (item.snapshot?.mode !== "image") {
      return false;
    }

    const requestId = ++restoreRequestIdRef.current;
    const snapshot = item.snapshot;
    const originalImageUrl = snapshot.originalImageDataUrl || snapshot.originalImageUrl;
    const modifiedImageUrl = snapshot.modifiedImageDataUrl || snapshot.modifiedImageUrl;
    const originalImageType = snapshot.originalImageType || inferImageType(originalImageUrl);
    const modifiedImageType = snapshot.modifiedImageType || inferImageType(modifiedImageUrl);
    const originalKnownSize = normalizeKnownSize(snapshot.originalImageSize);
    const modifiedKnownSize = normalizeKnownSize(snapshot.modifiedImageSize);

    const originalImageMeta = toRestoredImageMeta(
      originalImageUrl,
      snapshot.originalImageName ?? "Original image",
      originalImageType,
      originalKnownSize ?? -1,
      snapshot.originalImageWidth ?? 0,
      snapshot.originalImageHeight ?? 0
    );

    const modifiedImageMeta = toRestoredImageMeta(
      modifiedImageUrl,
      snapshot.modifiedImageName ?? "Modified image",
      modifiedImageType,
      modifiedKnownSize ?? -1,
      snapshot.modifiedImageWidth ?? 0,
      snapshot.modifiedImageHeight ?? 0
    );

    setOriginalImage(originalImageMeta);
    setModifiedImage(modifiedImageMeta);
    restoreAlignmentTransform(snapshot.imageAlignmentTransform ?? null, snapshot.imageAlignmentMetadata ?? null);

    setCompareMode("side-by-side");
    setIsMetadataPanelOpen(false);

    const needsOriginalSizeBackfill = originalKnownSize === null;
    const needsModifiedSizeBackfill = modifiedKnownSize === null;
    const needsTypeBackfill = !snapshot.originalImageType || !snapshot.modifiedImageType;

    if (needsOriginalSizeBackfill || needsModifiedSizeBackfill || needsTypeBackfill) {
      const backfillMetadata = async () => {
        const [resolvedOriginalSize, resolvedModifiedSize] = await Promise.all([
          needsOriginalSizeBackfill ? resolveImageSize(originalImageUrl) : Promise.resolve(originalKnownSize),
          needsModifiedSizeBackfill ? resolveImageSize(modifiedImageUrl) : Promise.resolve(modifiedKnownSize)
        ]);

        if (requestId !== restoreRequestIdRef.current) {
          return;
        }

        const currentState = useImageCompareStore.getState();
        const isCurrentRestoredPair =
          currentState.originalImage?.url === originalImageUrl
          && currentState.modifiedImage?.url === modifiedImageUrl;

        const originalFinalSize = resolvedOriginalSize ?? originalKnownSize ?? originalImageMeta.size;
        const modifiedFinalSize = resolvedModifiedSize ?? modifiedKnownSize ?? modifiedImageMeta.size;

        if (isCurrentRestoredPair) {
          const latestOriginalImage = useImageCompareStore.getState().originalImage;
          if (
            latestOriginalImage?.url === originalImageUrl
            && typeof originalFinalSize === "number"
            && Number.isFinite(originalFinalSize)
            && originalFinalSize > 0
            && latestOriginalImage.size !== originalFinalSize
          ) {
            setOriginalImage({
              ...latestOriginalImage,
              size: originalFinalSize
            });
          }

          const latestModifiedImage = useImageCompareStore.getState().modifiedImage;
          if (
            latestModifiedImage?.url === modifiedImageUrl
            && typeof modifiedFinalSize === "number"
            && Number.isFinite(modifiedFinalSize)
            && modifiedFinalSize > 0
            && latestModifiedImage.size !== modifiedFinalSize
          ) {
            setModifiedImage({
              ...latestModifiedImage,
              size: modifiedFinalSize
            });
          }
        }

        const nextSnapshotMetadata: {
          originalImageType?: string;
          modifiedImageType?: string;
          originalImageSize?: number;
          modifiedImageSize?: number;
        } = {};

        if (!snapshot.originalImageType && originalImageType) {
          nextSnapshotMetadata.originalImageType = originalImageType;
        }

        if (!snapshot.modifiedImageType && modifiedImageType) {
          nextSnapshotMetadata.modifiedImageType = modifiedImageType;
        }

        if (needsOriginalSizeBackfill && typeof resolvedOriginalSize === "number" && resolvedOriginalSize > 0) {
          nextSnapshotMetadata.originalImageSize = resolvedOriginalSize;
        }

        if (needsModifiedSizeBackfill && typeof resolvedModifiedSize === "number" && resolvedModifiedSize > 0) {
          nextSnapshotMetadata.modifiedImageSize = resolvedModifiedSize;
        }

        if (Object.keys(nextSnapshotMetadata).length > 0) {
          await HistoryService.updateImageSnapshotMetadataAsync(item.id, nextSnapshotMetadata);
        }
      };

      void backfillMetadata().catch(console.error);
    }

    return true;
  }, [restoreAlignmentTransform, setCompareMode, setIsMetadataPanelOpen, setModifiedImage, setOriginalImage]);

  return { restoreImageHistoryItem };
}
