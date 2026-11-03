"use client";

import type { ReactNode } from "react";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { ZoomControls } from "@/components/ui/ZoomControls";
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
  const setZoom = (nextZoom: number) => setViewport({ ...viewport, zoom: clamp(nextZoom, MIN_FIT_ZOOM, maxZoom) });

  return (
    <WorkspaceToolbar variant="card" className="justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        {children}
        {notice && <span className="text-xs font-semibold text-warning" role="status">{notice}</span>}
        <span className="hidden text-xs text-text-secondary lg:inline">{hint}</span>
      </div>
      <ZoomControls
        scale={fitScale * zoom}
        minScale={fitScale * MIN_FIT_ZOOM}
        maxScale={fitScale * maxZoom}
        step={ZOOM_STEP}
        onScaleChange={(scale) => setZoom(zoomForPixelScale(scale, fitScale))}
        isFit={Math.abs(zoom - DEFAULT_VIEWPORT.zoom) < 0.001}
        onFit={() => setViewport({ ...DEFAULT_VIEWPORT })}
      />
    </WorkspaceToolbar>
  );
}
