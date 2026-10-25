"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../store/useImageCompareStore";
import {
  DEFAULT_VIEWPORT,
  ZOOM_STEP,
  getFitScale,
  getViewTransform,
  panViewport,
  zoomAtPoint,
  type ImageViewportState,
  type ViewTransform,
  type ViewportSize
} from "../utils/viewport";

export type ViewportDraw = (ctx: CanvasRenderingContext2D, transform: ViewTransform, view: ViewportSize) => void;

interface ImageViewportCanvasProps {
  content: ViewportSize | null;
  draw: ViewportDraw;
  label: string;
  dividerPosition?: number;
  onDividerChange?: (position: number) => void;
  onFitScaleChange?: (fitScale: number) => void;
  className?: string;
  children?: ReactNode;
}

type Gesture =
  | { kind: "pan"; startX: number; startY: number; viewport: ImageViewportState }
  | { kind: "pinch"; distance: number; midX: number; midY: number; viewport: ImageViewportState }
  | { kind: "divider" }
  | null;

const DIVIDER_STEP = 0.01;
const DIVIDER_LARGE_STEP = 0.1;
const KEYBOARD_PAN_RATIO = 0.1;

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function wheelDelta(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * 400;
  return event.deltaY;
}

export function ImageViewportCanvas({ content, draw, label, dividerPosition, onDividerChange, onFitScaleChange, className, children }: ImageViewportCanvasProps) {
  const viewport = useImageCompareStore((state) => state.viewport);
  const setViewport = useImageCompareStore((state) => state.setViewport);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [pixelRatio, setPixelRatio] = useState(1);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>(null);
  const isPointerInside = useRef(false);
  const latest = useRef({ viewport, size, content, isSpaceHeld });
  useLayoutEffect(() => {
    latest.current = { viewport, size, content, isSpaceHeld };
  }, [content, isSpaceHeld, size, viewport]);
  const hasDivider = onDividerChange !== undefined && dividerPosition !== undefined;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const rect = container.getBoundingClientRect();
      setSize((current) => (current.width === rect.width && current.height === rect.height ? current : { width: rect.width, height: rect.height }));
      setPixelRatio(window.devicePixelRatio || 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (content && size.width > 0 && size.height > 0) {
      onFitScaleChange?.(getFitScale(size, content));
    }
  }, [content, onFitScaleChange, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width <= 0 || size.height <= 0) return;
    const deviceWidth = Math.max(1, Math.round(size.width * pixelRatio));
    const deviceHeight = Math.max(1, Math.round(size.height * pixelRatio));
    if (canvas.width !== deviceWidth) canvas.width = deviceWidth;
    if (canvas.height !== deviceHeight) canvas.height = deviceHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!content) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const transform = getViewTransform(viewport, size, content);
    draw(ctx, transform, size);
  }, [content, draw, pixelRatio, size, viewport]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) return;
      const container = containerRef.current;
      const isFocused = container !== null && container.contains(document.activeElement);
      if (!isPointerInside.current && !isFocused) return;
      event.preventDefault();
      setIsSpaceHeld(true);
    };
    const onKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.code === "Space") setIsSpaceHeld(false);
    };
    const onBlur = () => setIsSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const localPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }, []);

  const updateDivider = useCallback((clientX: number) => {
    const { content: currentContent, size: currentSize, viewport: currentViewport } = latest.current;
    if (!onDividerChange || !currentContent) return;
    const transform = getViewTransform(currentViewport, currentSize, currentContent);
    const { x } = localPoint(clientX, 0);
    onDividerChange((x - transform.offsetX) / (currentContent.width * transform.scale));
  }, [localPoint, onDividerChange]);

  const zoomAround = useCallback((nextZoom: number, point: { x: number; y: number }) => {
    const { content: currentContent, size: currentSize, viewport: currentViewport } = latest.current;
    if (!currentContent) return;
    setViewport(zoomAtPoint(currentViewport, nextZoom, point, currentSize, currentContent));
  }, [setViewport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { viewport: currentViewport } = latest.current;
      zoomAround(currentViewport.zoom * Math.exp(-wheelDelta(event) * 0.0015), localPoint(event.clientX, event.clientY));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [localPoint, zoomAround]);

  const startPinch = () => {
    const [first, second] = [...pointers.current.values()];
    gesture.current = {
      kind: "pinch",
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
      midX: (first.x + second.x) / 2,
      midY: (first.y + second.y) / 2,
      viewport: latest.current.viewport
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 1) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
    if (pointers.current.size === 2) {
      startPinch();
      setIsPanning(false);
      return;
    }
    if (pointers.current.size > 2) return;
    const point = localPoint(event.clientX, event.clientY);
    if (!hasDivider || latest.current.isSpaceHeld || event.button === 1) {
      gesture.current = { kind: "pan", startX: point.x, startY: point.y, viewport: latest.current.viewport };
      setIsPanning(true);
    } else {
      gesture.current = { kind: "divider" };
      updateDivider(event.clientX);
    }
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = localPoint(event.clientX, event.clientY);
    pointers.current.set(event.pointerId, point);
    const current = gesture.current;
    const { content: currentContent, size: currentSize } = latest.current;
    if (!current || !currentContent) return;
    if (current.kind === "divider") {
      updateDivider(event.clientX);
    } else if (current.kind === "pan") {
      setViewport(panViewport(current.viewport, point.x - current.startX, point.y - current.startY, currentSize, currentContent));
    } else if (pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      const zoomed = zoomAtPoint(current.viewport, current.viewport.zoom * (distance / current.distance), { x: current.midX, y: current.midY }, currentSize, currentContent);
      setViewport(panViewport(zoomed, midX - current.midX, midY - current.midY, currentSize, currentContent));
    }
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setIsPanning(false);
    } else if (gesture.current?.kind === "pinch") {
      gesture.current = null;
    }
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    const { content: currentContent, size: currentSize, viewport: currentViewport } = latest.current;
    if (!currentContent) return;
    const transform = getViewTransform(currentViewport, currentSize, currentContent);
    if (transform.scale < 0.999) {
      zoomAround(1 / getFitScale(currentSize, currentContent), localPoint(event.clientX, event.clientY));
    } else {
      setViewport({ ...DEFAULT_VIEWPORT });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { content: currentContent, size: currentSize, viewport: currentViewport } = latest.current;
    const center = { x: currentSize.width / 2, y: currentSize.height / 2 };
    if (event.key === "+" || event.key === "=") {
      zoomAround(currentViewport.zoom * ZOOM_STEP, center);
    } else if (event.key === "-" || event.key === "_") {
      zoomAround(currentViewport.zoom / ZOOM_STEP, center);
    } else if (event.key === "0") {
      setViewport({ ...DEFAULT_VIEWPORT });
    } else if (hasDivider && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      const step = (event.shiftKey ? DIVIDER_LARGE_STEP : DIVIDER_STEP) * (event.key === "ArrowLeft" ? -1 : 1);
      onDividerChange(dividerPosition + step);
    } else if (hasDivider && (event.key === "Home" || event.key === "End")) {
      onDividerChange(event.key === "Home" ? 0 : 1);
    } else if (!hasDivider && currentContent && event.key.startsWith("Arrow")) {
      const distance = (event.shiftKey ? 3 : 1) * KEYBOARD_PAN_RATIO;
      const deltaX = event.key === "ArrowLeft" ? currentSize.width * distance : event.key === "ArrowRight" ? -currentSize.width * distance : 0;
      const deltaY = event.key === "ArrowUp" ? currentSize.height * distance : event.key === "ArrowDown" ? -currentSize.height * distance : 0;
      setViewport(panViewport(currentViewport, deltaX, deltaY, currentSize, currentContent));
    } else {
      return;
    }
    event.preventDefault();
  };

  const showsPanCursor = !hasDivider || isSpaceHeld || isPanning;
  const dividerPercent = hasDivider ? Math.round(dividerPosition * 100) : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      {...(hasDivider
        ? { role: "slider", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": dividerPercent, "aria-valuetext": `${dividerPercent}% original` }
        : { role: "group" })}
      aria-label={label}
      aria-keyshortcuts="+ - 0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerEnter={() => { isPointerInside.current = true; }}
      onPointerLeave={() => { isPointerInside.current = false; }}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative min-h-0 touch-none select-none overflow-hidden rounded-lg border border-border-default bg-bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
        showsPanCursor ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-col-resize",
        className
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      {children}
    </div>
  );
}
