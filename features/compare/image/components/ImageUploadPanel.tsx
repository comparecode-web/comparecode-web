"use client";

import { useCallback, useRef, useState } from "react";
import { MdCloudUpload, MdImage, MdClose, MdContentPaste } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ImageFileMeta, useImageCompareStore } from "../store/useImageCompareStore";
import { useToastStore } from "@/store/useToastStore";
import { readExifData } from "../utils/exifReader";
import { canAllocateCanvas } from "@/utils/canvasBudget";
import { getImageFileFromClipboardData, readClipboardImage } from "@/utils/clipboardImage";

function reportUploadError(message: string) {
  useToastStore.getState().pushToast({ message, tone: "error", dedupeKey: `image-upload-error:${message}` });
}

interface ImageUploadSlotProps {
  label: string;
  image: ImageFileMeta | null;
  onImageLoad: (img: ImageFileMeta) => void;
  onClear: () => void;
}

function ImageUploadSlot({ label, image, onImageLoad, onClear }: ImageUploadSlotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOriginalSlot = label === "Original";
  const dimensionsClassName = isOriginalSlot ? "text-destructive" : "text-success";

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      reportUploadError("Choose an image file, such as PNG, JPEG, WebP, or SVG.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new window.Image();

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to decode image"));
        img.src = url;
      });
    } catch {
      URL.revokeObjectURL(url);
      reportUploadError("This image could not be opened. Your browser may not support its format.");
      return;
    }

    if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      URL.revokeObjectURL(url);
      reportUploadError("This image has no size. Add width and height to the SVG and try again.");
      return;
    }

    if (!canAllocateCanvas(img.naturalWidth, img.naturalHeight)) {
      URL.revokeObjectURL(url);
      reportUploadError(`This image (${img.naturalWidth}x${img.naturalHeight}) is too large for this browser.`);
      return;
    }

    try {
      const exif = await readExifData(file);

      const meta: ImageFileMeta = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        width: img.naturalWidth,
        height: img.naturalHeight,
        url,
        exif
      };

      onImageLoad(meta);
    } catch {
      URL.revokeObjectURL(url);
    }
  }, [onImageLoad]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = getImageFileFromClipboardData(e.clipboardData);
    if (file) processFile(file);
  }, [processFile]);

  const pasteFromClipboard = async () => {
    const result = await readClipboardImage();
    if (result.file) await processFile(result.file);
    else reportUploadError(result.error);
  };

  const pasteButton = (
    <Button variant="outline" size="sm" leftIcon={<MdContentPaste />} onClick={() => void pasteFromClipboard()} className="ml-auto">
      Paste
    </Button>
  );

  if (image) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4 shadow-sm">
        <div className="min-w-0 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-secondary">{label}</span>
            <span className={cn("text-xs font-bold shrink-0", dimensionsClassName)}>{`${image.width}x${image.height}`}</span>
            {pasteButton}
            <IconButton
              variant="danger"
              size="sm"
              onClick={onClear}
              title={`Clear ${label.toLowerCase()} image`}
            >
              <MdClose className="text-lg" />
            </IconButton>
          </div>
          <p className="text-xs text-text-secondary truncate" title={image.name}>{image.name}</p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border-default bg-bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.name}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        {pasteButton}
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors focus-visible:outline-2 focus-visible:outline-accent @2xl/image:gap-4 @2xl/image:p-4",
          isDragging
            ? "border-accent bg-accent/10"
            : "border-border-default bg-bg-secondary hover:border-accent hover:bg-hover-overlay"
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-hover-overlay @2xl/image:size-12">
          <MdCloudUpload className="text-2xl text-text-secondary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">Drop image here</p>
          <p className="text-xs text-text-secondary mt-0.5">or click to browse</p>
        </div>
        <p className="text-xs text-text-secondary">PNG, JPG, GIF, WebP, BMP, AVIF</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

interface ImageUploadPanelProps {
  compact?: boolean;
}

export function ImageUploadPanel({ compact = false }: ImageUploadPanelProps) {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const setOriginalImage = useImageCompareStore((s) => s.setOriginalImage);
  const setModifiedImage = useImageCompareStore((s) => s.setModifiedImage);

  if (compact && (originalImage || modifiedImage)) {
    return (
      <div className="flex gap-3 px-3 py-2 border-b border-border-default">
        <MdImage className="text-text-secondary text-lg shrink-0 mt-0.5" />
        <div className="flex gap-4 flex-1 min-w-0 text-xs text-text-secondary">
          {originalImage ? (
            <span className="truncate">
              <span className="font-semibold">Original:</span> {originalImage.name} ({originalImage.width}×{originalImage.height})
            </span>
          ) : (
            <span className="text-text-secondary">Original: no image</span>
          )}
          {modifiedImage ? (
            <span className="truncate">
              <span className="font-semibold">Modified:</span> {modifiedImage.name} ({modifiedImage.width}×{modifiedImage.height})
            </span>
          ) : (
            <span className="text-text-secondary">Modified: no image</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-2 gap-3 @2xl/image:grid-cols-2 @2xl/image:grid-rows-1">
      <ImageUploadSlot
        label="Original"
        image={originalImage}
        onImageLoad={setOriginalImage}
        onClear={() => setOriginalImage(null)}
      />
      <ImageUploadSlot
        label="Modified"
        image={modifiedImage}
        onImageLoad={setModifiedImage}
        onClear={() => setModifiedImage(null)}
      />
    </div>
  );
}
