"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";
import { ResetButton } from "@/components/ui/ResetButton";
import { Slider } from "@/components/ui/Slider";
import { useImageCompareStore, type ImageFileMeta } from "../store/useImageCompareStore";
import { createComparisonLayers, loadComparisonImage, renderDiff, type ComparisonLayers, type DiffStats } from "../services/ImageDiffService";
import { drawLayer } from "../utils/layerRendering";
import type { ViewTransform, ViewportSize } from "../utils/viewport";
import { DiffLegend } from "./DiffLegend";
import { ImageViewportCanvas } from "./ImageViewportCanvas";
import { ImageViewportControls } from "./ImageViewportControls";

const DEFAULT_FADE_VALUE = 500;
const PAN_HINT = "Drag to pan. Scroll or pinch to zoom. Double-click for 100%.";
const SLIDER_HINT = "Drag to compare. Space + drag to pan. Scroll to zoom.";
const DIVIDER_HANDLE_RADIUS = 10;
const RENDER_FAILED_MESSAGE = "These images are too large to display in this browser.";
const REDUCED_RESOLUTION_NOTICE = "Large images are shown at reduced resolution.";
const OVERLAY_LABEL = "pointer-events-none absolute top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white";

function snapToDevicePixel(ctx: CanvasRenderingContext2D, value: number): number {
  const ratio = ctx.getTransform().a || 1;
  return Math.round(value * ratio) / ratio;
}

function drawDivider(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
  if (bottom <= top) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(x - 2, top, 4, bottom - top);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 1, top, 2, bottom - top);

  const centerY = snapToDevicePixel(ctx, (top + bottom) / 2);
  ctx.beginPath();
  ctx.arc(x, centerY, DIVIDER_HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.stroke();

  ctx.strokeStyle = "#404040";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const direction of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + direction * 2.5, centerY - 3);
    ctx.lineTo(x + direction * 5.5, centerY);
    ctx.lineTo(x + direction * 2.5, centerY + 3);
    ctx.stroke();
  }
}

interface AsyncResource<T> {
  value: T | null;
  failed: boolean;
}

function useAsyncResource<T>(key: string | null, load: () => Promise<T>): AsyncResource<T> {
  const [state, setState] = useState<{ key: string; value: T | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    load().then((value) => {
      if (!cancelled) setState({ key, value, failed: false });
    }).catch((error: unknown) => {
      console.error(error);
      if (!cancelled) setState({ key, value: null, failed: true });
    });
    return () => {
      cancelled = true;
    };
    // The key identifies every input of the load function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return key && state?.key === key ? { value: state.value, failed: state.failed } : { value: null, failed: false };
}

function useComparisonLayers(): AsyncResource<ComparisonLayers> {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const alignmentTransform = useImageCompareStore((s) => s.alignment.appliedTransform);
  const key = originalImage && modifiedImage ? JSON.stringify([originalImage.url, modifiedImage.url, alignmentTransform]) : null;
  return useAsyncResource(key, () => createComparisonLayers(originalImage!.url, modifiedImage!.url, alignmentTransform));
}

function getReducedResolutionNotice(scale: number | undefined): string | undefined {
  return scale !== undefined && scale < 1 ? REDUCED_RESOLUTION_NOTICE : undefined;
}

function EmptyViewportMessage({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="text-sm text-text-secondary">{children}</span>
    </div>
  );
}

function SideBySidePane({ image, title, dimensionClassName, onFitScaleChange }: { image: ImageFileMeta | null; title: string; dimensionClassName: string; onFitScaleChange?: (fitScale: number) => void }) {
  const { value: canvas, failed } = useAsyncResource(image?.url ?? null, () => loadComparisonImage(image!.url));
  const draw = useCallback((ctx: CanvasRenderingContext2D, transform: ViewTransform) => {
    if (canvas) drawLayer(ctx, canvas, transform);
  }, [canvas]);
  const content: ViewportSize | null = canvas ? { width: canvas.width, height: canvas.height } : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex min-w-0 shrink-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">{title}</span>
          {image && <span className={cn("shrink-0 text-xs font-bold", dimensionClassName)}>{`${image.width}x${image.height}`}</span>}
        </div>
        {image && <span className="truncate text-xs text-text-secondary">{image.name}</span>}
      </div>
      <ImageViewportCanvas content={content} draw={draw} label={`${title} image`} onFitScaleChange={onFitScaleChange} className="flex-1">
        {failed && <EmptyViewportMessage>{RENDER_FAILED_MESSAGE}</EmptyViewportMessage>}
      </ImageViewportCanvas>
    </div>
  );
}

function SideBySideView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const [fitScale, setFitScale] = useState(1);

  return (
    <>
      <ImageViewportControls fitScale={fitScale} hint={PAN_HINT} />
      <div className="flex min-h-0 w-full flex-1 gap-3">
        <SideBySidePane image={originalImage} title="Original" dimensionClassName="text-destructive" onFitScaleChange={setFitScale} />
        <SideBySidePane image={modifiedImage} title="Modified" dimensionClassName="text-success" />
      </div>
    </>
  );
}

function FadeView() {
  const fadeValue = useImageCompareStore((s) => s.fadeValue);
  const setFadeValue = useImageCompareStore((s) => s.setFadeValue);
  const ready = useImageCompareStore((s) => Boolean(s.originalImage && s.modifiedImage));
  const { value: layers, failed } = useComparisonLayers();
  const [fitScale, setFitScale] = useState(1);
  const draw = useCallback((ctx: CanvasRenderingContext2D, transform: ViewTransform) => {
    if (!layers) return;
    drawLayer(ctx, layers.original, transform, layers);
    ctx.globalAlpha = fadeValue / 1000;
    drawLayer(ctx, layers.modified, transform, layers);
    ctx.globalAlpha = 1;
  }, [fadeValue, layers]);

  return (
    <>
      <ImageViewportControls fitScale={fitScale} hint={PAN_HINT} notice={getReducedResolutionNotice(layers?.scale)}>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
          <span className="text-xs font-semibold text-text-secondary">Original</span>
          <Slider
            aria-label="Fade between original and modified"
            min={0}
            max={1000}
            value={fadeValue}
            onChange={(event) => setFadeValue(Number(event.target.value))}
            containerClassName="min-w-0 flex-1"
          />
          <span className="text-xs font-semibold text-text-secondary">Modified</span>
          <span className="w-10 text-right text-xs font-bold tabular-nums text-text-primary">{Math.round(fadeValue / 10)}%</span>
          <ResetButton size="sm" onClick={() => setFadeValue(DEFAULT_FADE_VALUE)} isDirty={fadeValue !== DEFAULT_FADE_VALUE} title="Restore default fade" />
        </div>
      </ImageViewportControls>
      <ImageViewportCanvas content={layers} draw={draw} label="Fade comparison" onFitScaleChange={setFitScale} className="flex-1">
        {!ready && <EmptyViewportMessage>Load both images to use Fade mode</EmptyViewportMessage>}
        {failed && <EmptyViewportMessage>{RENDER_FAILED_MESSAGE}</EmptyViewportMessage>}
      </ImageViewportCanvas>
    </>
  );
}

function SliderView() {
  const sliderPosition = useImageCompareStore((s) => s.sliderPosition);
  const setSliderPosition = useImageCompareStore((s) => s.setSliderPosition);
  const ready = useImageCompareStore((s) => Boolean(s.originalImage && s.modifiedImage));
  const { value: layers, failed } = useComparisonLayers();
  const [fitScale, setFitScale] = useState(1);
  const draw = useCallback((ctx: CanvasRenderingContext2D, transform: ViewTransform, view: ViewportSize) => {
    if (!layers) return;
    drawLayer(ctx, layers.modified, transform, layers);
    const dividerX = snapToDevicePixel(ctx, transform.offsetX + sliderPosition * layers.width * transform.scale);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, dividerX, view.height);
    ctx.clip();
    drawLayer(ctx, layers.original, transform, layers);
    ctx.restore();
    drawDivider(ctx, dividerX, Math.max(0, transform.offsetY), Math.min(view.height, transform.offsetY + layers.height * transform.scale));
  }, [layers, sliderPosition]);

  return (
    <>
      <ImageViewportControls fitScale={fitScale} hint={SLIDER_HINT} notice={getReducedResolutionNotice(layers?.scale)} />
      <ImageViewportCanvas
        content={layers}
        draw={draw}
        label="Comparison divider"
        dividerPosition={sliderPosition}
        onDividerChange={setSliderPosition}
        onFitScaleChange={setFitScale}
        className="flex-1"
      >
        {ready && !failed && (
          <>
            <span className={cn(OVERLAY_LABEL, "left-2")}>Original</span>
            <span className={cn(OVERLAY_LABEL, "right-2")}>Modified</span>
          </>
        )}
        {!ready && <EmptyViewportMessage>Load both images to use Slider mode</EmptyViewportMessage>}
        {failed && <EmptyViewportMessage>{RENDER_FAILED_MESSAGE}</EmptyViewportMessage>}
      </ImageViewportCanvas>
    </>
  );
}

function DiffView() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const diffAlgorithm = useImageCompareStore((s) => s.diffAlgorithm);
  const alignmentTransform = useImageCompareStore((s) => s.alignment.appliedTransform);
  const [fitScale, setFitScale] = useState(1);
  const key = originalImage && modifiedImage ? JSON.stringify([originalImage.url, modifiedImage.url, diffAlgorithm, alignmentTransform]) : null;
  const { value: result, failed } = useAsyncResource(key, async () => {
    const canvas = document.createElement("canvas");
    const stats: DiffStats = await renderDiff(originalImage!.url, modifiedImage!.url, canvas, diffAlgorithm, alignmentTransform);
    return { canvas, stats };
  });
  const content = useMemo<ViewportSize | null>(() => {
    if (!result) return null;
    const scale = result.stats.scale ?? 1;
    return { width: result.canvas.width / scale, height: result.canvas.height / scale };
  }, [result]);
  const draw = useCallback((ctx: CanvasRenderingContext2D, transform: ViewTransform) => {
    if (result && content) drawLayer(ctx, result.canvas, transform, content);
  }, [content, result]);
  const stats = result?.stats;

  return (
    <>
      <ImageViewportControls fitScale={fitScale} hint={PAN_HINT} notice={getReducedResolutionNotice(stats?.scale)}>
        {stats && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">{stats.differentPixels.toLocaleString()}</span> different pixels
            </span>
            <span className="text-xs text-text-secondary">
              <span className={cn("font-semibold", stats.percentDifferent > 10 ? "text-destructive" : stats.percentDifferent > 1 ? "text-warning" : "text-success")}>
                {stats.percentDifferent.toFixed(2)}%
              </span> changed
            </span>
          </div>
        )}
      </ImageViewportControls>
      <ImageViewportCanvas content={content} draw={draw} label="Difference image" onFitScaleChange={setFitScale} className="flex-1">
        {!key && <EmptyViewportMessage>Load both images to compute diff</EmptyViewportMessage>}
        {failed && <EmptyViewportMessage>{RENDER_FAILED_MESSAGE}</EmptyViewportMessage>}
      </ImageViewportCanvas>
      <DiffLegend diffAlgorithm={diffAlgorithm} />
    </>
  );
}

export function ImageCompareCanvas() {
  const compareMode = useImageCompareStore((s) => s.compareMode);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5">
      {compareMode === "side-by-side" && <SideBySideView />}
      {compareMode === "fade" && <FadeView />}
      {compareMode === "slider" && <SliderView />}
      {compareMode === "diff" && <DiffView />}
    </div>
  );
}
