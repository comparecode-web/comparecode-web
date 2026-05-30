"use client";

import {
  MdViewSidebar,
  MdBlurOn,
  MdSwapHoriz,
  MdDifference,
  MdInfo,
  MdDelete,
} from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import {
  useImageCompareStore,
  ImageCompareMode,
  DiffAlgorithm,
} from "../store/useImageCompareStore";

const MODES: { value: ImageCompareMode; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { value: "side-by-side", label: "Side by Side", shortLabel: "SxS", icon: <MdViewSidebar className="text-base" /> },
  { value: "fade", label: "Fade", shortLabel: "Fade", icon: <MdBlurOn className="text-base" /> },
  { value: "slider", label: "Slider", shortLabel: "Slide", icon: <MdSwapHoriz className="text-base" /> },
  { value: "diff", label: "Diff", shortLabel: "Diff", icon: <MdDifference className="text-base" /> },
];

const DIFF_ALGORITHMS: { value: DiffAlgorithm; label: string }[] = [
  { value: "highlight",     label: "Highlight" },
  { value: "absolute",      label: "Absolute" },
  { value: "subtract",      label: "Subtract" },
  { value: "xor",           label: "XOR" },
  { value: "perceptual",    label: "Perceptual (ΔE)" },
  { value: "heatmap",       label: "Heatmap" },
  { value: "ssim",          label: "SSIM" },
  { value: "edge",          label: "Edge / Outline" },
  { value: "threshold",     label: "Threshold Mask" },
  { value: "channel-split", label: "Channel Split" },
];

export function ImageCompareToolbar() {
  const compareMode = useImageCompareStore((s) => s.compareMode);
  const setCompareMode = useImageCompareStore((s) => s.setCompareMode);
  const diffAlgorithm = useImageCompareStore((s) => s.diffAlgorithm);
  const setDiffAlgorithm = useImageCompareStore((s) => s.setDiffAlgorithm);
  const isMetadataPanelOpen = useImageCompareStore((s) => s.isMetadataPanelOpen);
  const setIsMetadataPanelOpen = useImageCompareStore((s) => s.setIsMetadataPanelOpen);
  const clearAll = useImageCompareStore((s) => s.clearAll);
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);

  const hasImages = !!(originalImage || modifiedImage);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-default bg-bg-primary px-3 py-2 sm:px-4">
      <div className="flex items-center gap-0.5 rounded-md border border-border-default bg-bg-secondary p-0.5">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setCompareMode(mode.value)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold transition-all duration-(--duration-short)",
              compareMode === mode.value
                ? "bg-accent-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
            )}
            title={mode.label}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden">{mode.shortLabel}</span>
          </button>
        ))}
      </div>

      {compareMode === "diff" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-semibold hidden sm:inline">Algorithm</span>
          <SelectDropdown
            value={diffAlgorithm}
            options={DIFF_ALGORITHMS}
            onChange={(v) => setDiffAlgorithm(v as DiffAlgorithm)}
            className="w-36 sm:w-44"
          />
        </div>
      )}

      <div className="flex-1" />

      <Button
        variant={isMetadataPanelOpen ? "outline" : "ghost"}
        size="sm"
        onClick={() => setIsMetadataPanelOpen(!isMetadataPanelOpen)}
        leftIcon={<MdInfo />}
        title="File Metadata"
        disabled={!hasImages}
      >
        <span className="hidden sm:inline">Metadata</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={clearAll}
        leftIcon={<MdDelete />}
        title="Clear all"
        disabled={!hasImages}
        className="text-text-secondary hover:text-danger"
      >
        <span className="hidden sm:inline">Clear</span>
      </Button>
    </div>
  );
}
