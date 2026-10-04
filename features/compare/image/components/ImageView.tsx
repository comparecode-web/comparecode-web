"use client";

import { useEffect, useRef } from "react";
import { MdInfo, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { HistoryService } from "@/services/historyService";
import { cn } from "@/utils/uiHelpers";
import { Button } from "@/components/ui/Button";
import { useImageCompareStore } from "../store/useImageCompareStore";
import { ImageUploadPanel } from "./ImageUploadPanel";
import { ImageCompareToolbar } from "./ImageCompareToolbar";
import { ImageCompareCanvas } from "./ImageCompareCanvas";
import { ImageMetadataPanel } from "./ImageMetadataPanel";
import { createImageDataUrl, createImageThumbnailDataUrl } from "../utils/thumbnail";
import { AlignmentPrompt } from "./alignment/AlignmentPrompt";
import { ImageAlignmentPanel } from "./alignment/ImageAlignmentPanel";
import { getPairKey, imagesNeedAlignmentPrompt } from "../services/alignment/transformUtils";

export function ImageView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const isMetadataPanelOpen = useImageCompareStore((s) => s.isMetadataPanelOpen);
  const toggleMetadataPanel = useImageCompareStore((s) => s.toggleMetadataPanel);
  const alignment = useImageCompareStore((s) => s.alignment);
  const openAlignmentPrompt = useImageCompareStore((s) => s.openAlignmentPrompt);
  const lastSavedImagePairKeyRef = useRef<string | null>(null);

  const bothLoaded = !!(originalImage && modifiedImage);

  useEffect(() => {
    const pairKey = getPairKey(originalImage, modifiedImage);
    if (!pairKey || !imagesNeedAlignmentPrompt(originalImage, modifiedImage)) return;
    if (alignment.appliedTransform || alignment.isPromptOpen || alignment.skippedPairKey === pairKey || alignment.promptPairKey === pairKey) return;
    openAlignmentPrompt(pairKey);
  }, [alignment.appliedTransform, alignment.isPromptOpen, alignment.promptPairKey, alignment.skippedPairKey, modifiedImage, openAlignmentPrompt, originalImage]);

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
      modifiedImage.height,
      alignment.appliedTransform ? JSON.stringify(alignment.appliedTransform) : "no-alignment"
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
        modifiedThumbnailDataUrl,
        imageAlignmentTransform: currentState.alignment.appliedTransform,
        imageAlignmentMetadata: currentState.alignment.metadata
      });
    };

    void saveSnapshot().catch(console.error);

    return () => {
      isActive = false;
    };
  }, [alignment.appliedTransform, bothLoaded, modifiedImage, originalImage]);

  return (
    <div className="@container/image flex h-full min-w-0 w-full flex-col gap-3 overflow-hidden bg-bg-secondary p-2">
      {!bothLoaded ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ImageUploadPanel />
        </div>
      ) : (
        <>
          <ImageCompareToolbar />
          <AlignmentPrompt />
          <ImageAlignmentPanel />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-sm">
            <ImageCompareCanvas />
          </div>

          <div className="shrink-0 rounded-xl border border-border-default bg-bg-primary px-2 py-1.5 sm:px-3 sm:py-2">
            <div className="flex items-center justify-center">
              <Button size="sm"
                onClick={toggleMetadataPanel}
                aria-expanded={isMetadataPanelOpen}
                aria-controls="image-metadata"
                title={isMetadataPanelOpen ? "Hide metadata" : "Show metadata"}
              >
                <MdInfo className="text-base shrink-0" />
                <span>Metadata</span>
                {isMetadataPanelOpen ? <MdKeyboardArrowDown className="text-xl shrink-0" /> : <MdKeyboardArrowUp className="text-xl shrink-0" />}
              </Button>
            </div>
          </div>

          <div
            id="image-metadata"
            aria-hidden={!isMetadataPanelOpen}
            inert={!isMetadataPanelOpen}
            className={cn(
              "grid min-h-0 max-h-[35%] shrink overflow-hidden rounded-xl bg-bg-primary z-10 transition-[grid-template-rows,opacity,margin-top] duration-200 ease-in-out motion-reduce:transition-none",
              isMetadataPanelOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0 -mt-3"
            )}
          >
            <div className="min-h-0 overflow-y-auto custom-scrollbar">
              <div className="rounded-xl border border-border-default">
                <ImageMetadataPanel
                  originalImage={originalImage}
                  modifiedImage={modifiedImage}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
