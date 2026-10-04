"use client";

import { useState } from "react";
import {
  MdDelete,
  MdDownload,
  MdTune,
  MdSync,
} from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { useToastStore } from "@/store/useToastStore";
import {
  useImageCompareStore,
  ImageCompareMode,
  DiffAlgorithm,
} from "../store/useImageCompareStore";
import { ImageSnapshotService } from "../services/ImageSnapshotService";
import { AutoAlignButton } from "./alignment/AutoAlignButton";

const MODES: Array<{ value: ImageCompareMode; label: string }> = [
  { value: "side-by-side", label: "Side by side" },
  { value: "fade", label: "Fade" },
  { value: "slider", label: "Slider" },
  { value: "diff", label: "Advanced" },
];

const DIFF_ALGORITHMS: { value: DiffAlgorithm; label: string }[] = [
  { value: "highlight",     label: "Highlight" },
  { value: "absolute",      label: "Absolute" },
  { value: "subtract",      label: "Subtract" },
  { value: "xor",           label: "XOR" },
  { value: "perceptual",    label: "Perceptual (ΔE)" },
  { value: "heatmap",       label: "Heatmap" },
  { value: "ssim",          label: "SSIM" },
  { value: "edge",          label: "Edge / outline" },
  { value: "threshold",     label: "Threshold mask" },
  { value: "channel-split", label: "Channel split" },
];

export function ImageCompareToolbar() {
  const compareMode = useImageCompareStore((s) => s.compareMode);
  const setCompareMode = useImageCompareStore((s) => s.setCompareMode);
  const diffAlgorithm = useImageCompareStore((s) => s.diffAlgorithm);
  const setDiffAlgorithm = useImageCompareStore((s) => s.setDiffAlgorithm);
  const clearAll = useImageCompareStore((s) => s.clearAll);
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const openAlignmentPanel = useImageCompareStore((s) => s.openAlignmentPanel);
  const fadeValue = useImageCompareStore((s) => s.fadeValue);
  const sliderPosition = useImageCompareStore((s) => s.sliderPosition);
  const alignmentTransform = useImageCompareStore((s) => s.alignment.appliedTransform);
  const pushToast = useToastStore((s) => s.pushToast);

  const [isDownloading, setIsDownloading] = useState(false);

  const hasImages = !!(originalImage || modifiedImage);
  const hasBothImages = !!(originalImage && modifiedImage);

  const handleDownloadSnapshot = async () => {
    if (!originalImage || !modifiedImage || isDownloading) return;
    setIsDownloading(true);
    try {
      const filename = await ImageSnapshotService.downloadSnapshot({
        compareMode,
        originalImage,
        modifiedImage,
        fadeValue,
        sliderPosition,
        diffAlgorithm,
        alignmentTransform,
      });
      pushToast({
        message: `Downloaded snapshot as ${filename}`,
        tone: "success",
        icon: "success",
      });
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : "Failed to download snapshot",
        tone: "error",
        icon: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <WorkspaceToolbar variant="card" className="max-h-[40%] overflow-y-auto custom-scrollbar">
      <div className="hidden min-w-0 @2xl/image:block">
        <SelectionBar<ImageCompareMode>
          options={MODES}
          value={compareMode}
          onChange={setCompareMode}
          buttonClassName="whitespace-nowrap px-3"
        />
      </div>
      <SelectDropdown
        label="Comparison mode"
        value={compareMode}
        options={MODES}
        onChange={setCompareMode}
        className="w-36 @2xl/image:hidden"
        size="sm"
      />

      {compareMode === "diff" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-semibold hidden sm:inline">Algorithm</span>
          <SelectDropdown
            value={diffAlgorithm}
            options={DIFF_ALGORITHMS}
            onChange={setDiffAlgorithm}
            className="w-36 sm:w-44"
            size="sm"
          />
        </div>
      )}

      <div className="flex-1" />

      <AutoAlignButton />

      <Button
        variant="primary"
        size="sm"
        onClick={openAlignmentPanel}
        disabled={!hasBothImages}
        leftIcon={<MdTune className="text-lg" />}
        className="hidden @2xl/image:inline-flex"
      >
        Adjust alignment
      </Button>
      <IconButton
        variant="primary"
        size="sm"
        onClick={openAlignmentPanel}
        disabled={!hasBothImages}
        title="Adjust alignment"
        className="@2xl/image:hidden"
      >
        <MdTune />
      </IconButton>

      <DownloadSnapshotButton
        onDownload={handleDownloadSnapshot}
        disabled={!hasBothImages}
        isDownloading={isDownloading}
      />

      <ClearButton onClear={clearAll} disabled={!hasImages} />
    </WorkspaceToolbar>
  );
}

interface DownloadSnapshotButtonProps {
  onDownload: () => void;
  disabled?: boolean;
  isDownloading?: boolean;
}

function DownloadSnapshotButton({ onDownload, disabled = false, isDownloading = false }: DownloadSnapshotButtonProps) {
  return (
    <IconButton
      onClick={onDownload}
      variant="primary"
      size="sm"
      title="Download snapshot"
      aria-busy={isDownloading}
      disabled={disabled || isDownloading}
    >
      {isDownloading ? <MdSync className="animate-spin motion-reduce:animate-none" /> : <MdDownload />}
    </IconButton>
  );
}

interface ClearButtonProps {
  onClear: () => void;
  disabled?: boolean;
}

function ClearButton({ onClear, disabled = false }: ClearButtonProps) {
  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={onClear}
        leftIcon={<MdDelete className="text-xl" />}
        disabled={disabled}
        className="hidden md:inline-flex"
      >
        Clear
      </Button>
      <IconButton
        onClick={onClear}
        variant="dangerGhost"
        className="md:hidden"
        title="Clear comparison"
        disabled={disabled}
      >
        <MdDelete className="text-xl" />
      </IconButton>
    </>
  );
}
