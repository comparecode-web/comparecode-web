"use client";

import {
  MdDelete,
  MdTune,
} from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import {
  useImageCompareStore,
  ImageCompareMode,
  DiffAlgorithm,
} from "../store/useImageCompareStore";

const MODES: Array<{ value: ImageCompareMode; label: string }> = [
  { value: "side-by-side", label: "Side by Side" },
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
  { value: "edge",          label: "Edge / Outline" },
  { value: "threshold",     label: "Threshold Mask" },
  { value: "channel-split", label: "Channel Split" },
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

  const hasImages = !!(originalImage || modifiedImage);
  const hasBothImages = !!(originalImage && modifiedImage);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-default bg-bg-primary px-3 py-2 sm:px-4">
      <div className="w-full sm:w-auto sm:min-w-120">
        <SelectionBar<ImageCompareMode>
          options={MODES}
          value={compareMode}
          onChange={setCompareMode}
        />
      </div>

      {compareMode === "diff" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-semibold hidden sm:inline">Algorithm</span>
          <SelectDropdown
            value={diffAlgorithm}
            options={DIFF_ALGORITHMS}
            onChange={(v) => setDiffAlgorithm(v as DiffAlgorithm)}
            className="w-36 sm:w-44"
            triggerClassName="py-1.5"
          />
        </div>
      )}

      <div className="flex-1" />

      <Button
        variant="primary"
        size="sm"
        onClick={openAlignmentPanel}
        disabled={!hasBothImages}
        leftIcon={<MdTune className="text-lg" />}
        title="Align images"
      >
        Align images
      </Button>

      <ClearButton onClear={clearAll} disabled={!hasImages} />
    </div>
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
        title="Clear comparison"
        disabled={disabled}
        className="hidden md:inline-flex"
      >
        Clear
      </Button>
      <button
        onClick={onClear}
        className="md:hidden p-2 text-danger hover:bg-hover-overlay rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Clear comparison"
        disabled={disabled}
      >
        <MdDelete className="text-xl" />
      </button>
    </>
  );
}
