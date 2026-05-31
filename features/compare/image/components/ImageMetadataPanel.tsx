"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MdFolderOpen } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { ImageFileMeta } from "../store/useImageCompareStore";
import { computeFileHash, formatFileSize } from "../utils/exifReader";

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

function MetaRow({ label, value }: MetaRowProps) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border-default/50 last:border-b-0">
      <span className="text-xs font-semibold text-text-secondary shrink-0">{label}</span>
      <span className="text-xs text-text-primary text-right break-all">{value}</span>
    </div>
  );
}

function formatAbsoluteFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatFileSizeDifference(bytes: number): string {
  const sign = bytes >= 0 ? "+" : "-";
  const absBytes = Math.abs(bytes);
  return `${sign} ${formatAbsoluteFileSize(absBytes)}`;
}

interface ImageMetaPanelProps {
  image: ImageFileMeta;
  title: string;
  sizeDifferenceBytes?: number;
  sizeDifferenceClassName?: string;
}

function ImageMetaPanel({ image, title, sizeDifferenceBytes, sizeDifferenceClassName }: ImageMetaPanelProps) {
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
  const fileSizeWithDifference = sizeDifferenceBytes === undefined
    ? formatFileSize(image.size)
    : (
      <span className="inline-flex items-baseline gap-1">
        <span>{formatFileSize(image.size)}</span>
        <span className={cn("font-semibold", sizeDifferenceClassName)}>
          ({formatFileSizeDifference(sizeDifferenceBytes)})
        </span>
      </span>
    );

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <p className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
        <MdFolderOpen className="text-base text-text-secondary" />
        {title}
      </p>

      <div className="rounded-lg border border-border-default bg-bg-secondary px-3 py-1">
        <MetaRow label="File name" value={image.name} />
        <MetaRow label="File size" value={fileSizeWithDifference} />
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
}

export function ImageMetadataPanel({ originalImage, modifiedImage }: ImageMetadataPanelProps) {
  if (!originalImage && !modifiedImage) return null;

  const sizeDifferenceBytes = originalImage && modifiedImage
    ? originalImage.size - modifiedImage.size
    : undefined;

  return (
    <div className="flex flex-col gap-0 bg-bg-primary">
      <div className={cn(
        "flex gap-4 p-4",
        originalImage && modifiedImage ? "flex-row" : "flex-col"
      )}>
        {originalImage && (
          <ImageMetaPanel
            image={originalImage}
            title="Original"
            sizeDifferenceBytes={sizeDifferenceBytes}
            sizeDifferenceClassName={sizeDifferenceBytes !== undefined ? "text-danger" : undefined}
          />
        )}
        {modifiedImage && (
          <ImageMetaPanel
            image={modifiedImage}
            title="Modified"
            sizeDifferenceBytes={sizeDifferenceBytes !== undefined ? -sizeDifferenceBytes : undefined}
            sizeDifferenceClassName={sizeDifferenceBytes !== undefined ? "text-success" : undefined}
          />
        )}
      </div>
    </div>
  );
}
