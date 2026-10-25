"use client";

import type { ReactNode } from "react";
import { MdZoomIn, MdZoomOut } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Slider } from "@/components/ui/Slider";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../store/useImageCompareStore";
import { DEFAULT_VIEWPORT, MIN_FIT_ZOOM, ZOOM_STEP, getMaxZoom, zoomForPixelScale } from "../utils/viewport";

interface ImageViewportControlsProps {
  fitScale: number;
  hint: string;
  notice?: string;
  children?: ReactNode;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ImageViewportControls({ fitScale, hint, notice, children }: ImageViewportControlsProps) {
  const viewport = useImageCompareStore((state) => state.viewport);
  const setViewport = useImageCompareStore((state) => state.setViewport);
  const maxZoom = getMaxZoom(fitScale);
  const zoom = clamp(viewport.zoom, MIN_FIT_ZOOM, maxZoom);
  const pixelScale = fitScale * zoom;
  const setZoom = (nextZoom: number) => setViewport({ ...viewport, zoom: clamp(nextZoom, MIN_FIT_ZOOM, maxZoom) });
  const toSliderValue = (fitZoom: number) => Math.round(Math.log2(fitScale * fitZoom) * 100);
  const isFit = Math.abs(zoom - DEFAULT_VIEWPORT.zoom) < 0.001;
  const isActualSize = Math.abs(pixelScale - 1) < 0.001;

  return (
    <WorkspaceToolbar variant="card" className="justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        {children}
        {notice && <span className="text-xs font-semibold text-warning" role="status">{notice}</span>}
        <span className="hidden text-xs text-text-secondary lg:inline">{hint}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5" role="group" aria-label="Zoom">
        <IconButton size="sm" title="Zoom out (-)" aria-label="Zoom out" onClick={() => setZoom(zoom / ZOOM_STEP)} disabled={zoom <= MIN_FIT_ZOOM + 0.001}>
          <MdZoomOut />
        </IconButton>
        <Slider
          aria-label="Zoom"
          min={toSliderValue(MIN_FIT_ZOOM)}
          max={toSliderValue(maxZoom)}
          step={1}
          value={toSliderValue(zoom)}
          onChange={(event) => setZoom(zoomForPixelScale(2 ** (Number(event.target.value) / 100), fitScale))}
          containerClassName="w-24 sm:w-32"
        />
        <IconButton size="sm" title="Zoom in (+)" aria-label="Zoom in" onClick={() => setZoom(zoom * ZOOM_STEP)} disabled={zoom >= maxZoom - 0.001}>
          <MdZoomIn />
        </IconButton>
        <span className="w-12 text-right text-xs font-bold tabular-nums text-text-primary" aria-live="polite">{Math.round(pixelScale * 100)}%</span>
        <Button size="sm" variant="outline" className={cn(isFit && "border-accent/40 text-accent")} onClick={() => setViewport({ ...DEFAULT_VIEWPORT })}>Fit</Button>
        <Button size="sm" variant="outline" className={cn(isActualSize && "border-accent/40 text-accent")} onClick={() => setZoom(zoomForPixelScale(1, fitScale))}>100%</Button>
      </div>
    </WorkspaceToolbar>
  );
}
