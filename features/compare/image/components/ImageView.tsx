"use client";

import { MdImage } from "react-icons/md";
import { useImageCompareStore } from "../store/useImageCompareStore";
import { ImageUploadPanel } from "./ImageUploadPanel";
import { ImageCompareToolbar } from "./ImageCompareToolbar";
import { ImageCompareCanvas } from "./ImageCompareCanvas";
import { ImageMetadataPanel } from "./ImageMetadataPanel";

export function ImageView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const isMetadataPanelOpen = useImageCompareStore((s) => s.isMetadataPanelOpen);
  const setIsMetadataPanelOpen = useImageCompareStore((s) => s.setIsMetadataPanelOpen);

  const bothLoaded = !!(originalImage && modifiedImage);

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary overflow-hidden">
      <div className="flex h-(--header-height) shrink-0 items-center border-b border-border-default bg-bg-primary px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdImage className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Image Compare</h2>
        </div>
      </div>

      {!bothLoaded ? (
        <div className="flex-1 flex flex-col overflow-auto custom-scrollbar">
          <ImageUploadPanel />
        </div>
      ) : (
        <>
          <ImageCompareToolbar />

          <ImageUploadPanel compact />

          <div className="flex-1 min-h-0 flex flex-col">
            <ImageCompareCanvas />
          </div>

          {isMetadataPanelOpen && (
            <div className="shrink-0 max-h-[45%] overflow-y-auto custom-scrollbar">
              <ImageMetadataPanel
                originalImage={originalImage}
                modifiedImage={modifiedImage}
                onClose={() => setIsMetadataPanelOpen(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
