"use client";

import { useCallback, useRef, useState } from "react";
import { MdCloudUpload, MdImage, MdClose } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { Button } from "@/components/ui/Button";
import { ImageFileMeta, useImageCompareStore } from "../store/useImageCompareStore";
import { readExifData } from "../utils/exifReader";

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
  const dimensionsClassName = isOriginalSlot ? "text-danger" : "text-success";

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    const img = new window.Image();

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to decode image"));
        img.src = url;
      });

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
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
        break;
      }
    }
  }, [processFile]);

  if (image) {
    return (
      <div className="flex min-h-0 flex-1 min-w-0 flex-col gap-2">
        <div className="min-w-0 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
            <span className={cn("text-xs font-bold shrink-0", dimensionsClassName)}>{`${image.width}x${image.height}`}</span>
            <Button
              variant="danger"
              size="icon"
              onClick={onClear}
              title={`Clear ${label.toLowerCase()} image`}
              className="ml-auto"
            >
              <MdClose className="text-lg" />
            </Button>
          </div>
          <p className="text-xs text-text-secondary truncate" title={image.name}>{image.name}</p>
        </div>
        <div className="relative rounded-lg border border-border-default bg-bg-secondary overflow-hidden flex flex-1 items-center justify-center min-h-[120px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.name}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 min-w-0 flex-col gap-2">
      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed min-h-[180px] cursor-pointer transition-all duration-(--duration-short)",
          isDragging
            ? "border-accent-primary bg-accent-primary/10"
            : "border-border-default bg-bg-secondary hover:border-accent-primary hover:bg-hover-overlay"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hover-overlay">
          <MdCloudUpload className="text-2xl text-text-secondary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">Drop image here</p>
          <p className="text-xs text-text-secondary mt-0.5">or click to browse · paste from clipboard</p>
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
    <div className="flex h-full min-h-full flex-col gap-4 p-4 sm:flex-row sm:p-6">
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
