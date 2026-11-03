"use client";

import { MdZoomIn, MdZoomOut } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Slider } from "./Slider";

interface ZoomControlsProps {
  scale: number;
  minScale: number;
  maxScale: number;
  step: number;
  onScaleChange: (scale: number) => void;
  isFit: boolean;
  onFit: () => void;
  className?: string;
}

const tolerance = 0.001;

function toSliderValue(scale: number): number {
  return Math.round(Math.log2(scale) * 100);
}

export function ZoomControls({ scale, minScale, maxScale, step, onScaleChange, isFit, onFit, className }: ZoomControlsProps) {
  const isActualSize = Math.abs(scale - 1) < tolerance;

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)} role="group" aria-label="Zoom">
      <IconButton size="sm" title="Zoom out (-)" aria-label="Zoom out" onClick={() => onScaleChange(scale / step)} disabled={scale <= minScale * (1 + tolerance)}>
        <MdZoomOut />
      </IconButton>
      <Slider
        aria-label="Zoom"
        min={toSliderValue(minScale)}
        max={toSliderValue(maxScale)}
        step={1}
        value={toSliderValue(scale)}
        onChange={(event) => onScaleChange(2 ** (Number(event.target.value) / 100))}
        containerClassName="w-24 sm:w-32"
      />
      <IconButton size="sm" title="Zoom in (+)" aria-label="Zoom in" onClick={() => onScaleChange(scale * step)} disabled={scale >= maxScale * (1 - tolerance)}>
        <MdZoomIn />
      </IconButton>
      <span className="w-12 text-right text-xs font-bold tabular-nums text-text-primary" aria-live="polite">{Math.round(scale * 100)}%</span>
      <Button size="sm" variant="outline" className={cn(isFit && "border-accent/40 text-accent")} onClick={onFit}>Fit</Button>
      <Button size="sm" variant="outline" className={cn(isActualSize && "border-accent/40 text-accent")} onClick={() => onScaleChange(1)}>100%</Button>
    </div>
  );
}
