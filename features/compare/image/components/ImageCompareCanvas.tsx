"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../store/useImageCompareStore";
import { renderDiff, renderFade, DiffStats } from "../services/ImageDiffService";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const SOFT_CLAMP_START_ZOOM = 1.35;
const SOFT_CLAMP_RANGE = 2.5;
const SOFT_OVERSCROLL_RATIO = 0.1;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Side-by-Side

function SideBySideView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);

  const origCanvasRef = useRef<HTMLCanvasElement>(null);
  const modCanvasRef = useRef<HTMLCanvasElement>(null);
  const origContainerRef = useRef<HTMLDivElement>(null);
  const modContainerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const panAtDrag = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const origImgEl = useRef<HTMLImageElement | null>(null);
  const modImgEl = useRef<HTMLImageElement | null>(null);

  const getPanLimits = useCallback((allowOverscroll: boolean) => {
    const zoom = stateRef.current.zoom;
    const pairs = [
      [origCanvasRef.current, origImgEl.current],
      [modCanvasRef.current, modImgEl.current],
    ] as Array<[HTMLCanvasElement | null, HTMLImageElement | null]>;

    let hasComparablePair = false;
    let maxPanX = Number.POSITIVE_INFINITY;
    let maxPanY = Number.POSITIVE_INFINITY;

    pairs.forEach(([canvas, img]) => {
      if (!canvas || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;

      hasComparablePair = true;

      const fitScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const renderedWidth = img.naturalWidth * fitScale * zoom;
      const renderedHeight = img.naturalHeight * fitScale * zoom;
      const hardPanX = Math.max(0, (renderedWidth - canvas.width) / 2);
      const hardPanY = Math.max(0, (renderedHeight - canvas.height) / 2);

      let overscrollX = 0;
      let overscrollY = 0;
      if (allowOverscroll && zoom > SOFT_CLAMP_START_ZOOM) {
        const softProgress = clampNumber((zoom - SOFT_CLAMP_START_ZOOM) / SOFT_CLAMP_RANGE, 0, 1);
        overscrollX = canvas.width * SOFT_OVERSCROLL_RATIO * softProgress;
        overscrollY = canvas.height * SOFT_OVERSCROLL_RATIO * softProgress;
      }

      maxPanX = Math.min(maxPanX, hardPanX + overscrollX);
      maxPanY = Math.min(maxPanY, hardPanY + overscrollY);
    });

    if (!hasComparablePair || !Number.isFinite(maxPanX) || !Number.isFinite(maxPanY)) {
      return { maxPanX: 0, maxPanY: 0 };
    }

    return { maxPanX, maxPanY };
  }, []);

  const clampPanState = useCallback((allowOverscroll: boolean) => {
    const { maxPanX, maxPanY } = getPanLimits(allowOverscroll);
    stateRef.current.panX = clampNumber(stateRef.current.panX, -maxPanX, maxPanX);
    stateRef.current.panY = clampNumber(stateRef.current.panY, -maxPanY, maxPanY);
  }, [getPanLimits]);

  const drawCanvas = useCallback((canvas: HTMLCanvasElement, img: HTMLImageElement | null) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    if (!img) return;
    const { zoom, panX, panY } = stateRef.current;
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight) * zoom;
    const dx = width / 2 - (img.naturalWidth / 2) * scale + panX;
    const dy = height / 2 - (img.naturalHeight / 2) * scale + panY;
    ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
  }, []);

  const redrawBoth = useCallback(() => {
    if (origCanvasRef.current) drawCanvas(origCanvasRef.current, origImgEl.current);
    if (modCanvasRef.current) drawCanvas(modCanvasRef.current, modImgEl.current);
  }, [drawCanvas]);

  useEffect(() => {
    if (!originalImage) { origImgEl.current = null; redrawBoth(); return; }
    const img = new Image();
    img.onload = () => { origImgEl.current = img; clampPanState(false); redrawBoth(); };
    img.src = originalImage.url;
  }, [clampPanState, originalImage, redrawBoth]);

  useEffect(() => {
    if (!modifiedImage) { modImgEl.current = null; redrawBoth(); return; }
    const img = new Image();
    img.onload = () => { modImgEl.current = img; clampPanState(false); redrawBoth(); };
    img.src = modifiedImage.url;
  }, [clampPanState, modifiedImage, redrawBoth]);

  useEffect(() => {
    const pairs = [
      [origContainerRef.current, origCanvasRef.current],
      [modContainerRef.current, modCanvasRef.current],
    ] as [HTMLDivElement | null, HTMLCanvasElement | null][];

    const resize = () => {
      pairs.forEach(([container, canvas]) => {
        if (!container || !canvas) return;
        const { width, height } = container.getBoundingClientRect();
        if (width > 0 && height > 0) { canvas.width = Math.round(width); canvas.height = Math.round(height); }
      });
      clampPanState(false);
      redrawBoth();
    };

    const ro = new ResizeObserver(resize);
    pairs.forEach(([c]) => c && ro.observe(c));
    resize();
    return () => ro.disconnect();
  }, [clampPanState, redrawBoth]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    stateRef.current.zoom = clampNumber(stateRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    clampPanState(true);
    redrawBoth();
  }, [clampPanState, redrawBoth]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    dragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    panAtDrag.current = { x: stateRef.current.panX, y: stateRef.current.panY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    stateRef.current.panX = panAtDrag.current.x + (e.clientX - dragOrigin.current.x);
    stateRef.current.panY = panAtDrag.current.y + (e.clientY - dragOrigin.current.y);
    clampPanState(true);
    redrawBoth();
  }, [clampPanState, redrawBoth]);

  const handleMouseUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    clampPanState(false);
    redrawBoth();
  }, [clampPanState, redrawBoth]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      dragOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panAtDrag.current = { x: stateRef.current.panX, y: stateRef.current.panY };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      stateRef.current.zoom = clampNumber(stateRef.current.zoom * (dist / lastTouchDist.current), MIN_ZOOM, MAX_ZOOM);
      lastTouchDist.current = dist;
      clampPanState(true);
      redrawBoth();
    } else if (e.touches.length === 1) {
      stateRef.current.panX = panAtDrag.current.x + (e.touches[0].clientX - dragOrigin.current.x);
      stateRef.current.panY = panAtDrag.current.y + (e.touches[0].clientY - dragOrigin.current.y);
      clampPanState(true);
      redrawBoth();
    }
  }, [clampPanState, redrawBoth]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
    clampPanState(false);
    redrawBoth();
  }, [clampPanState, redrawBoth]);

  useEffect(() => {
    const canvases = [origCanvasRef.current, modCanvasRef.current].filter((c): c is HTMLCanvasElement => c !== null);
    canvases.forEach((c) => {
      c.addEventListener("wheel", handleWheel, { passive: false });
      c.addEventListener("mousedown", handleMouseDown);
      c.addEventListener("touchstart", handleTouchStart, { passive: false });
      c.addEventListener("touchmove", handleTouchMove, { passive: false });
      c.addEventListener("touchend", handleTouchEnd);
    });
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvases.forEach((c) => {
        c.removeEventListener("wheel", handleWheel);
        c.removeEventListener("mousedown", handleMouseDown);
        c.removeEventListener("touchstart", handleTouchStart);
        c.removeEventListener("touchmove", handleTouchMove);
        c.removeEventListener("touchend", handleTouchEnd);
      });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex gap-3 w-full h-full select-none">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="min-w-0 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Original</span>
            {originalImage && (
              <span className="text-xs font-bold text-danger shrink-0">{`${originalImage.width}x${originalImage.height}`}</span>
            )}
          </div>
          {originalImage && (
            <span className="text-xs text-text-secondary truncate">{originalImage.name}</span>
          )}
        </div>
        <div ref={origContainerRef} className="flex-1 min-h-0 rounded-lg border border-border-default bg-bg-secondary overflow-hidden cursor-grab active:cursor-grabbing">
          <canvas ref={origCanvasRef} className="block w-full h-full" />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="min-w-0 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Modified</span>
            {modifiedImage && (
              <span className="text-xs font-bold text-success shrink-0">{`${modifiedImage.width}x${modifiedImage.height}`}</span>
            )}
          </div>
          {modifiedImage && (
            <span className="text-xs text-text-secondary truncate">{modifiedImage.name}</span>
          )}
        </div>
        <div ref={modContainerRef} className="flex-1 min-h-0 rounded-lg border border-border-default bg-bg-secondary overflow-hidden cursor-grab active:cursor-grabbing">
          <canvas ref={modCanvasRef} className="block w-full h-full" />
        </div>
      </div>
    </div>
  );
}

function FadeView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const fadeValue = useImageCompareStore((s) => s.fadeValue);
  const setFadeValue = useImageCompareStore((s) => s.setFadeValue);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!originalImage || !modifiedImage || !canvasRef.current) return;
    renderFade(originalImage.url, modifiedImage.url, canvasRef.current, fadeValue / 1000);
  }, [originalImage, modifiedImage, fadeValue]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex justify-center">
        <div className="flex w-full items-center gap-3" style={{ width: "min(100%, clamp(18rem, 58vw, 34rem))" }}>
          <span className="text-xs text-text-secondary font-semibold shrink-0">Original</span>
          <input
            type="range"
            min={0}
            max={1000}
            value={fadeValue}
            onChange={(e) => setFadeValue(Number(e.target.value))}
            className="flex-1 min-w-0 custom-slider"
          />
          <span className="text-xs text-text-secondary font-semibold shrink-0">Modified</span>
          <span className="text-xs font-bold text-text-primary w-8 text-right">{(fadeValue / 10).toFixed(0)}%</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border border-border-default bg-bg-secondary flex items-center justify-center overflow-hidden">
        {originalImage && modifiedImage ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-sm text-text-secondary">Load both images to use Fade mode</span>
        )}
      </div>
    </div>
  );
}

function SliderView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const sliderPosition = useImageCompareStore((s) => s.sliderPosition);
  const setSliderPosition = useImageCompareStore((s) => s.setSliderPosition);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const origImgEl = useRef<HTMLImageElement | null>(null);
  const modImgEl = useRef<HTMLImageElement | null>(null);
  const sliderRef = useRef(sliderPosition);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const orig = origImgEl.current;
    const mod = modImgEl.current;
    if (!orig || !mod) return;

    const imgW = Math.max(orig.naturalWidth, mod.naturalWidth);
    const imgH = Math.max(orig.naturalHeight, mod.naturalHeight);
    const scale = Math.min(width / imgW, height / imgH);
    const fitW = imgW * scale;
    const fitH = imgH * scale;
    const offX = (width - fitW) / 2;
    const offY = (height - fitH) / 2;
    const divX = offX + sliderRef.current * fitW;

    ctx.drawImage(mod, offX, offY, fitW, fitH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, divX, height);
    ctx.clip();
    ctx.drawImage(orig, offX, offY, fitW, fitH);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(divX, offY);
    ctx.lineTo(divX, offY + fitH);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();

    const handleY = offY + fitH / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(divX, handleY, 16, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Arrows inside handle
    ctx.save();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(divX - 5, handleY - 4);
    ctx.lineTo(divX - 9, handleY);
    ctx.lineTo(divX - 5, handleY + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(divX + 5, handleY - 4);
    ctx.lineTo(divX + 9, handleY);
    ctx.lineTo(divX + 5, handleY + 4);
    ctx.stroke();
    ctx.restore();

    // Labels with drop shadow for readability
    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    const lPad = 8;
    ctx.fillText("Original", offX + lPad, offY + lPad + 13);
    const modLabel = "Modified";
    ctx.fillText(modLabel, offX + fitW - ctx.measureText(modLabel).width - lPad, offY + lPad + 13);
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!originalImage) { origImgEl.current = null; drawFrame(); return; }
    const img = new Image();
    img.onload = () => { origImgEl.current = img; drawFrame(); };
    img.src = originalImage.url;
  }, [originalImage, drawFrame]);

  useEffect(() => {
    if (!modifiedImage) { modImgEl.current = null; drawFrame(); return; }
    const img = new Image();
    img.onload = () => { modImgEl.current = img; drawFrame(); };
    img.src = modifiedImage.url;
  }, [modifiedImage, drawFrame]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) { canvas.width = Math.round(width); canvas.height = Math.round(height); drawFrame(); }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [drawFrame]);

  useEffect(() => {
    sliderRef.current = sliderPosition;
    drawFrame();
  }, [sliderPosition, drawFrame]);

  const updateFromClientX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    const orig = origImgEl.current;
    const mod = modImgEl.current;
    if (!canvas || !orig || !mod) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;
    const imgW = Math.max(orig.naturalWidth, mod.naturalWidth);
    const imgH = Math.max(orig.naturalHeight, mod.naturalHeight);
    const scale = Math.min(canvas.width / imgW, canvas.height / imgH);
    const fitW = imgW * scale;
    if (fitW <= 0) return;
    const offX = (canvas.width - fitW) / 2;
    setSliderPosition(clampNumber((canvasX - offX) / fitW, 0, 1));
  }, [setSliderPosition]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) updateFromClientX(e.clientX); };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [updateFromClientX]);

  const ready = originalImage && modifiedImage;

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        onMouseDown={(e) => { isDragging.current = true; updateFromClientX(e.clientX); e.preventDefault(); }}
        onTouchStart={(e) => { if (e.touches.length > 0) updateFromClientX(e.touches[0].clientX); }}
        onTouchMove={(e) => { if (e.touches.length > 0) { updateFromClientX(e.touches[0].clientX); e.preventDefault(); } }}
        className="relative flex-1 min-h-0 rounded-lg border border-border-default bg-bg-secondary overflow-hidden select-none cursor-col-resize"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-text-secondary">Load both images to use Slider mode</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Diff View

function DiffView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const diffAlgorithm = useImageCompareStore((s) => s.diffAlgorithm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<DiffStats | null>(null);
  const latestRenderRequestIdRef = useRef(0);

  const ready = originalImage && modifiedImage;

  useEffect(() => {
    if (!ready || !canvasRef.current) return;

    let cancelled = false;
    const requestId = ++latestRenderRequestIdRef.current;
    const visibleCanvas = canvasRef.current;
    const offscreenCanvas = document.createElement("canvas");

    renderDiff(originalImage.url, modifiedImage.url, offscreenCanvas, diffAlgorithm)
      .then((nextStats) => {
        if (cancelled || requestId !== latestRenderRequestIdRef.current) return;
        visibleCanvas.width = offscreenCanvas.width;
        visibleCanvas.height = offscreenCanvas.height;
        const visibleCtx = visibleCanvas.getContext("2d");
        if (!visibleCtx) return;
        visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
        visibleCtx.drawImage(offscreenCanvas, 0, 0);
        setStats(nextStats);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [ready, originalImage, modifiedImage, diffAlgorithm]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {stats && (
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{stats.differentPixels.toLocaleString()}</span> different pixels
          </span>
          <span className="text-xs text-text-secondary">
            <span className={cn("font-semibold", stats.percentDifferent > 10 ? "text-danger" : stats.percentDifferent > 1 ? "text-yellow-500" : "text-success")}>
              {stats.percentDifferent.toFixed(2)}%
            </span> changed
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 rounded-lg border border-border-default bg-bg-secondary flex items-center justify-center overflow-hidden">
        {ready ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-sm text-text-secondary">Load both images to compute diff</span>
        )}
      </div>

      {diffAlgorithm === "highlight" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#28C850]" /> Brightened in modified</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#F03C3C]" /> Darkened in modified</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#808080]" /> Unchanged</span>
        </div>
      )}
      {diffAlgorithm === "absolute" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Identical</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Maximum difference</span>
          <span className="text-xs text-text-secondary">Per-channel |orig − mod| × 4</span>
        </div>
      )}
      {diffAlgorithm === "subtract" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Same or original brighter</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Modified is brighter</span>
        </div>
      )}
      {diffAlgorithm === "perceptual" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#101018]" /> Imperceptible (ΔE &lt; 2)</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FFE600]" /> Noticeable</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF6000]" /> Clear</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Dramatic (ΔE &gt; 50)</span>
        </div>
      )}
      {diffAlgorithm === "heatmap" && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs text-text-secondary font-semibold">Change intensity:</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> None</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#0000FF]" /> Low</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /></span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FF00]" /></span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FFFF00]" /> High</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Max</span>
        </div>
      )}
      {diffAlgorithm === "ssim" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="text-xs text-text-secondary font-semibold">Structural dissimilarity:</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Identical (SSIM = 1)</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /> Some change</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Major difference</span>
        </div>
      )}
      {diffAlgorithm === "edge" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> No change boundary</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /> Edge of changed region</span>
        </div>
      )}
      {diffAlgorithm === "threshold" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Changed</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Unchanged</span>
        </div>
      )}
      {diffAlgorithm === "channel-split" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#ff4040]" /> R channel diff</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#40ff40]" /> G channel diff</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#4080ff]" /> B channel diff</span>
        </div>
      )}
    </div>
  );
}

// Export

export function ImageCompareCanvas() {
  const compareMode = useImageCompareStore((s) => s.compareMode);

  return (
    <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
      {compareMode === "side-by-side" && <SideBySideView />}
      {compareMode === "fade" && <FadeView />}
      {compareMode === "slider" && <SliderView />}
      {compareMode === "diff" && <DiffView />}
    </div>
  );
}
