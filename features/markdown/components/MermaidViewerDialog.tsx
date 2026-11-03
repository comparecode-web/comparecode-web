"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { MdDownload } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { ZoomControls } from "@/components/ui/ZoomControls";
import {
  diagramMaxZoom,
  diagramMinZoom,
  diagramZoomStep,
  getDiagramContentBox,
  getDiagramFitZoom,
  zoomDiagramAt,
  type DiagramSize,
  type DiagramViewport
} from "@/features/markdown/services/markdownDiagramViewport";
import type { NormalizedDiagramSvg } from "@/features/markdown/services/markdownDiagramExport";

interface MermaidViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svg: NormalizedDiagramSvg;
  onDownload: (format: "png" | "svg") => void;
}

const panStep = 48;

export function MermaidViewerDialog({ open, onOpenChange, svg, onDownload }: MermaidViewerDialogProps) {
  const titleId = useId();
  const viewRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const [viewSize, setViewSize] = useState<DiagramSize>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<DiagramViewport>({ zoom: 1, panX: 0, panY: 0 });
  const [hasFitted, setHasFitted] = useState(false);
  const content = { width: svg.width, height: svg.height };
  const box = getDiagramContentBox(viewport, viewSize, content);

  useLayoutEffect(() => {
    const element = viewRef.current;
    if (!open || !element) {
      return;
    }

    const measure = () => setViewSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  if (open && !hasFitted && viewSize.width > 0) {
    setHasFitted(true);
    setViewport({ zoom: getDiagramFitZoom(viewSize, content), panX: 0, panY: 0 });
  }

  if (!open && hasFitted) {
    setHasFitted(false);
  }

  const zoomTo = (zoom: number, point = { x: viewSize.width / 2, y: viewSize.height / 2 }) => {
    setViewport((current) => zoomDiagramAt(current, zoom, point, viewSize));
  };

  const fitZoom = getDiagramFitZoom(viewSize, content);
  const isFit = Math.abs(viewport.zoom - fitZoom) < 0.001 && viewport.panX === 0 && viewport.panY === 0;
  const fit = () => setViewport({ zoom: fitZoom, panX: 0, panY: 0 });

  const getViewPoint = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const factor = event.deltaY < 0 ? diagramZoomStep : 1 / diagramZoomStep;
    zoomTo(viewport.zoom * factor, getViewPoint(event));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pinchDistanceRef.current = null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) {
      return;
    }

    const next = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, next);
    const points = Array.from(pointersRef.current.values());

    if (points.length >= 2) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const rect = event.currentTarget.getBoundingClientRect();
      const center = { x: (points[0].x + points[1].x) / 2 - rect.left, y: (points[0].y + points[1].y) / 2 - rect.top };
      if (pinchDistanceRef.current) {
        const ratio = distance / pinchDistanceRef.current;
        setViewport((current) => zoomDiagramAt(current, current.zoom * ratio, center, viewSize));
      }
      pinchDistanceRef.current = distance;
      return;
    }

    setViewport((current) => ({ ...current, panX: current.panX + next.x - previous.x, panY: current.panY + next.y - previous.y }));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchDistanceRef.current = null;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const pans: Record<string, [number, number]> = { ArrowLeft: [panStep, 0], ArrowRight: [-panStep, 0], ArrowUp: [0, panStep], ArrowDown: [0, -panStep] };
    if (event.key === "+" || event.key === "=") {
      zoomTo(viewport.zoom * diagramZoomStep);
    } else if (event.key === "-") {
      zoomTo(viewport.zoom / diagramZoomStep);
    } else if (event.key === "0") {
      zoomTo(1);
    } else if (event.key.toLowerCase() === "f") {
      fit();
    } else if (pans[event.key]) {
      const [x, y] = pans[event.key];
      setViewport((current) => ({ ...current, panX: current.panX + x, panY: current.panY + y }));
    } else {
      return;
    }

    event.preventDefault();
  };

  return createPortal(
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
      className="h-[calc(100dvh-1.5rem)] max-h-none w-[calc(100%-1.5rem)] overflow-hidden sm:h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <DialogHeader title="Mermaid diagram" titleId={titleId} closeLabel="Close diagram viewer" onClose={() => onOpenChange(false)} className="py-3" />
        <WorkspaceToolbar className="justify-between gap-x-4 gap-y-2 px-3">
          <span className="hidden text-xs text-text-secondary md:inline">Drag to pan. Scroll or pinch to zoom. Double-click for 100%.</span>
          <ZoomControls
            className="ml-auto"
            scale={viewport.zoom}
            minScale={diagramMinZoom}
            maxScale={diagramMaxZoom}
            step={diagramZoomStep}
            onScaleChange={(zoom) => zoomTo(zoom)}
            isFit={isFit}
            onFit={fit}
          />
        </WorkspaceToolbar>
        <div
          ref={viewRef}
          tabIndex={0}
          role="img"
          aria-label="Mermaid diagram. Use plus and minus to zoom, arrow keys to pan, 0 for 100% and F to fit."
          className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden bg-[var(--markdown-mermaid-bg)] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:cursor-grabbing"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onDoubleClick={(event) => Math.abs(viewport.zoom - 1) < 0.001 ? fit() : zoomTo(1, getViewPoint(event))}
          onKeyDown={handleKeyDown}
        >
          <div
            className="pointer-events-none absolute [&_svg]:block [&_svg]:!h-full [&_svg]:!w-full [&_svg]:max-w-none"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            dangerouslySetInnerHTML={{ __html: svg.markup }}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border-default p-3">
          <Button variant="outline" leftIcon={<MdDownload className="text-lg" />} onClick={() => onDownload("svg")}>Download SVG</Button>
          <Button leftIcon={<MdDownload className="text-lg" />} onClick={() => onDownload("png")}>Download PNG</Button>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
