"use client";

import { useEffect, useRef } from "react";
import { MdInfo, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { HistoryService } from "@/services/historyService";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../store/useImageCompareStore";
import { ImageUploadPanel } from "./ImageUploadPanel";
import { ImageCompareToolbar } from "./ImageCompareToolbar";
import { ImageCompareCanvas } from "./ImageCompareCanvas";
import { ImageMetadataPanel } from "./ImageMetadataPanel";
import { createImageDataUrl, createImageThumbnailDataUrl } from "../utils/thumbnail";

export function ImageView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const isMetadataPanelOpen = useImageCompareStore((s) => s.isMetadataPanelOpen);
  const toggleMetadataPanel = useImageCompareStore((s) => s.toggleMetadataPanel);
  const lastSavedImagePairKeyRef = useRef<string | null>(null);

  const bothLoaded = !!(originalImage && modifiedImage);

  useEffect(() => {
    if (!bothLoaded || !originalImage || !modifiedImage) {
      lastSavedImagePairKeyRef.current = null;
      return;
    }

    let isActive = true;

    const pairKey = [
      originalImage.url,
      originalImage.width,
      originalImage.height,
      modifiedImage.url,
      modifiedImage.width,
      modifiedImage.height
    ].join("|");

    if (lastSavedImagePairKeyRef.current === pairKey) {
      return;
    }

    lastSavedImagePairKeyRef.current = pairKey;

    const saveSnapshot = async () => {
      const [
        originalThumbnailDataUrl,
        modifiedThumbnailDataUrl,
        originalImageDataUrl,
        modifiedImageDataUrl
      ] = await Promise.all([
        createImageThumbnailDataUrl(originalImage.url, 200, 200),
        createImageThumbnailDataUrl(modifiedImage.url, 200, 200),
        createImageDataUrl(originalImage.url),
        createImageDataUrl(modifiedImage.url)
      ]);

      if (!isActive) {
        return;
      }

      const currentState = useImageCompareStore.getState();
      const isCurrentPair =
        currentState.originalImage?.url === originalImage.url
        && currentState.modifiedImage?.url === modifiedImage.url
        && currentState.originalImage?.width === originalImage.width
        && currentState.originalImage?.height === originalImage.height
        && currentState.modifiedImage?.width === modifiedImage.width
        && currentState.modifiedImage?.height === modifiedImage.height;

      if (!isCurrentPair) {
        return;
      }

      await HistoryService.addSnapshotAsync({
        mode: "image",
        originalImageUrl: originalImage.url,
        modifiedImageUrl: modifiedImage.url,
        originalImageName: originalImage.name,
        modifiedImageName: modifiedImage.name,
        originalImageType: originalImage.type,
        modifiedImageType: modifiedImage.type,
        originalImageSize: originalImage.size,
        modifiedImageSize: modifiedImage.size,
        originalImageDataUrl,
        modifiedImageDataUrl,
        originalImageWidth: originalImage.width,
        originalImageHeight: originalImage.height,
        modifiedImageWidth: modifiedImage.width,
        modifiedImageHeight: modifiedImage.height,
        originalThumbnailDataUrl,
        modifiedThumbnailDataUrl
      });
    };

    void saveSnapshot().catch(console.error);

    return () => {
      isActive = false;
    };
  }, [bothLoaded, modifiedImage, originalImage]);

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary overflow-hidden">
      {!bothLoaded ? (
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <ImageUploadPanel />
        </div>
      ) : (
        <>
          <ImageCompareToolbar />

          <div className="flex-1 min-h-0 flex flex-col">
            <ImageCompareCanvas />
          </div>

          <div className="shrink-0 border-t border-border-default bg-bg-secondary px-2 py-1.5 sm:px-3 sm:py-2">
            <div className="flex items-center justify-center">
              <button
                onClick={toggleMetadataPanel}
                className="inline-flex items-center gap-2 rounded-md bg-accent-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors duration-(--duration-short) hover:bg-accent-hover"
                title={isMetadataPanelOpen ? "Hide Metadata" : "Show Metadata"}
              >
                <MdInfo className="text-base shrink-0" />
                <span>Metadata</span>
                {isMetadataPanelOpen ? <MdKeyboardArrowDown className="text-xl shrink-0" /> : <MdKeyboardArrowUp className="text-xl shrink-0" />}
              </button>
            </div>
          </div>

          <div
            className={cn(
              "shrink-0 transition-[max-height,opacity] duration-(--duration-medium) ease-in-out overflow-hidden bg-bg-primary z-10",
              isMetadataPanelOpen
                ? "max-h-120 border-t border-border-default shadow-sm opacity-100"
                : "max-h-0 opacity-0"
            )}
          >
            <div className="overflow-y-auto custom-scrollbar">
              <ImageMetadataPanel
                originalImage={originalImage}
                modifiedImage={modifiedImage}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
