"use client";

import { useEffect, useState } from "react";
import { MdInfo, MdClose, MdFolderOpen } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { Button } from "@/components/ui/Button";
import { ImageFileMeta } from "../store/useImageCompareStore";
import { computeFileHash, formatFileSize } from "../utils/exifReader";

interface MetaRowProps {
  label: string;
  value: string | number | undefined;
}

function MetaRow({ label, value }: MetaRowProps) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border-default/50 last:border-b-0">
      <span className="text-xs font-semibold text-text-secondary shrink-0">{label}</span>
      <span className="text-xs text-text-primary text-right break-all">{value}</span>
    </div>
  );
}

interface ImageMetaPanelProps {
  image: ImageFileMeta;
  title: string;
}

function ImageMetaPanel({ image, title }: ImageMetaPanelProps) {
  const [hash, setHash] = useState<string>("");

  useEffect(() => {
    // Recompute hash when image changes
    const objectUrl = image.url;

    fetch(objectUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], image.name, { type: image.type });
        return computeFileHash(file);
      })
      .then(setHash)
      .catch(() => setHash("n/a"));
  }, [image]);

  const resolutionUnit = image.exif?.ResolutionUnit === "3" ? "ppcm" : "ppi";
  const xRes = image.exif?.XResolution;
  const yRes = image.exif?.YResolution;
  const resString = xRes && yRes ? `${xRes} × ${yRes} ${resolutionUnit}` : undefined;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <p className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
        <MdFolderOpen className="text-base text-accent-primary" />
        {title}
      </p>

      <div className="rounded-lg border border-border-default bg-bg-secondary px-3 py-1">
        <MetaRow label="File name" value={image.name} />
        <MetaRow label="File size" value={formatFileSize(image.size)} />
        <MetaRow label="Format" value={image.type} />
        <MetaRow label="Dimensions" value={`${image.width} × ${image.height} px`} />
        <MetaRow label="Resolution" value={resString} />
        <MetaRow label="Hash (DJB2)" value={hash || "…"} />
      </div>

      {image.exif && Object.keys(image.exif).length > 0 && (
        <>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mt-2 mb-1">EXIF</p>
          <div className="rounded-lg border border-border-default bg-bg-secondary px-3 py-1 overflow-y-auto custom-scrollbar max-h-48">
            {Object.entries(image.exif).map(([key, val]) => (
              <MetaRow key={key} label={key} value={val} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ImageMetadataPanelProps {
  originalImage: ImageFileMeta | null;
  modifiedImage: ImageFileMeta | null;
  onClose: () => void;
}

export function ImageMetadataPanel({ originalImage, modifiedImage, onClose }: ImageMetadataPanelProps) {
  if (!originalImage && !modifiedImage) return null;

  return (
    <div className="flex flex-col gap-0 border-t border-border-default bg-bg-primary">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default">
        <div className="flex items-center gap-2">
          <MdInfo className="text-accent-primary text-lg" />
          <span className="text-sm font-bold text-text-primary">File Metadata</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <MdClose className="text-lg" />
        </Button>
      </div>

      <div className={cn(
        "flex gap-4 p-4 overflow-y-auto custom-scrollbar",
        originalImage && modifiedImage ? "flex-row" : "flex-col"
      )}>
        {originalImage && (
          <ImageMetaPanel image={originalImage} title="Original" />
        )}
        {modifiedImage && (
          <ImageMetaPanel image={modifiedImage} title="Modified" />
        )}
      </div>
    </div>
  );
}
