"use client";

import { PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { MdClose, MdDelete, MdFlip, MdLock, MdLockOpen, MdRestartAlt, MdRotateRight } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { estimateAutoAlignment } from "../../services/alignment/autoAlignService";
import { ImageAffineTransform } from "../../services/alignment/types";
import { clampNumber, createDefaultAlignmentTransform } from "../../services/alignment/transformUtils";

type TransformOption = "rotate" | "scale";

const TRANSFORM_OPTIONS: Array<{ value: TransformOption; label: string }> = [
  { value: "rotate", label: "Rotate" },
  { value: "scale", label: "Scale" }
];

interface StageSize {
  width: number;
  height: number;
  scale: number;
}

interface SnapGuide {
  axis: "x" | "y";
  position: number;
}

type DragState =
  | { mode: "move"; pointerId: number; startX: number; startY: number; transform: ImageAffineTransform }
  | { mode: "rotate"; pointerId: number; centerX: number; centerY: number; startAngle: number; transform: ImageAffineTransform }
  | { mode: "resize"; pointerId: number; centerX: number; centerY: number; startDistance: number; startHalfWidth: number; startHalfHeight: number; transform: ImageAffineTransform }
  | { mode: "pan"; pointerId: number; startX: number; startY: number; panX: number; panY: number };

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function getOptionValues(options: { rotate: boolean; scale: boolean; warp: boolean }): Array<TransformOption> {
  return (["rotate", "scale"] as Array<TransformOption>).filter((option) => options[option]);
}

function getSnapResult(
  transform: ImageAffineTransform,
  originalWidth: number,
  originalHeight: number,
  modifiedWidth: number,
  modifiedHeight: number,
  scale: number
): { transform: ImageAffineTransform; guides: SnapGuide[] } {
  const threshold = 9 / Math.max(scale, 0.001);
  const width = modifiedWidth * transform.scaleX;
  const height = modifiedHeight * transform.scaleY;
  let nextX = transform.x;
  let nextY = transform.y;
  const guides: SnapGuide[] = [];
  const centerTargetsX = [originalWidth / 2];
  const centerTargetsY = [originalHeight / 2];
  const edgeTargetsX = [0, originalWidth];
  const edgeTargetsY = [0, originalHeight];

  centerTargetsX.forEach((target) => {
    if (Math.abs(nextX - target) <= threshold) {
      nextX = target;
      guides.push({ axis: "x", position: target });
    }
  });
  centerTargetsY.forEach((target) => {
    if (Math.abs(nextY - target) <= threshold) {
      nextY = target;
      guides.push({ axis: "y", position: target });
    }
  });
  edgeTargetsX.forEach((target) => {
    if (Math.abs((nextX - width / 2) - target) <= threshold) {
      nextX = target + width / 2;
      guides.push({ axis: "x", position: target });
    }
    if (Math.abs((nextX + width / 2) - target) <= threshold) {
      nextX = target - width / 2;
      guides.push({ axis: "x", position: target });
    }
  });
  edgeTargetsY.forEach((target) => {
    if (Math.abs((nextY - height / 2) - target) <= threshold) {
      nextY = target + height / 2;
      guides.push({ axis: "y", position: target });
    }
    if (Math.abs((nextY + height / 2) - target) <= threshold) {
      nextY = target - height / 2;
      guides.push({ axis: "y", position: target });
    }
  });

  return {
    transform: { ...transform, x: nextX, y: nextY },
    guides
  };
}

export function ImageAlignmentPanel() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const alignment = useImageCompareStore((s) => s.alignment);
  const closeAlignmentPanel = useImageCompareStore((s) => s.closeAlignmentPanel);
  const setAlignmentDraftTransform = useImageCompareStore((s) => s.setAlignmentDraftTransform);
  const resetAlignmentDraft = useImageCompareStore((s) => s.resetAlignmentDraft);
  const resetAlignment = useImageCompareStore((s) => s.resetAlignment);
  const applyAlignmentTransform = useImageCompareStore((s) => s.applyAlignmentTransform);
  const updateAlignmentOptions = useImageCompareStore((s) => s.updateAlignmentOptions);
  const setAlignmentPreviewZoom = useImageCompareStore((s) => s.setAlignmentPreviewZoom);
  const setAlignmentSnappingEnabled = useImageCompareStore((s) => s.setAlignmentSnappingEnabled);
  const setAlignmentAspectRatioLocked = useImageCompareStore((s) => s.setAlignmentAspectRatioLocked);
  const setAlignmentStatus = useImageCompareStore((s) => s.setAlignmentStatus);
  const setAlignmentError = useImageCompareStore((s) => s.setAlignmentError);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<StageSize>({ width: 1, height: 1, scale: 1 });
  const [viewportPan, setViewportPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const dragRef = useRef<DragState | null>(null);

  const draftTransform = useMemo(() => {
    if (!originalImage || !modifiedImage) return null;
    return alignment.draftTransform ?? alignment.appliedTransform ?? createDefaultAlignmentTransform(originalImage, modifiedImage);
  }, [alignment.appliedTransform, alignment.draftTransform, modifiedImage, originalImage]);

  useEffect(() => {
    if (!alignment.isPanelOpen || !originalImage || !stageRef.current) return;

    const resize = () => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scale = Math.min(rect.width / originalImage.width, rect.height / originalImage.height) * alignment.previewZoom;
      setStageSize({
        width: originalImage.width * scale,
        height: originalImage.height * scale,
        scale
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stageRef.current);
    resize();

    return () => observer.disconnect();
  }, [alignment.isPanelOpen, alignment.previewZoom, originalImage]);

  useEffect(() => {
    if (!alignment.isPanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAlignmentPanel();
        return;
      }
      if (event.code === "Space" && event.target instanceof HTMLElement && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target.tagName)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
      if (!draftTransform) return;
      const amount = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") setAlignmentDraftTransform({ ...draftTransform, x: draftTransform.x - amount });
      if (event.key === "ArrowRight") setAlignmentDraftTransform({ ...draftTransform, x: draftTransform.x + amount });
      if (event.key === "ArrowUp") setAlignmentDraftTransform({ ...draftTransform, y: draftTransform.y - amount });
      if (event.key === "ArrowDown") setAlignmentDraftTransform({ ...draftTransform, y: draftTransform.y + amount });
    };

    document.addEventListener("keydown", handleKeyDown);
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [alignment.isPanelOpen, closeAlignmentPanel, draftTransform, setAlignmentDraftTransform]);

  const startPan = (event: PointerEvent<HTMLElement>) => {
    if (!stageRef.current) return;
    event.preventDefault();
    stageRef.current.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: viewportPan.x,
      panY: viewportPan.y
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    if (isSpacePressed) {
      startPan(event);
      return;
    }
    if (!draftTransform) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      transform: draftTransform
    };
  };

  const handleRotatePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!draftTransform || !overlayRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = overlayRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    dragRef.current = {
      mode: "rotate",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      transform: draftTransform
    };
  };

  const handleResizePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!draftTransform || !overlayRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = overlayRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    dragRef.current = {
      mode: "resize",
      pointerId: event.pointerId,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      startHalfWidth: Math.max(1, rect.width / 2),
      startHalfHeight: Math.max(1, rect.height / 2),
      transform: draftTransform
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    if (dragRef.current.mode === "pan") {
      setViewportPan({
        x: dragRef.current.panX + (event.clientX - dragRef.current.startX),
        y: dragRef.current.panY + (event.clientY - dragRef.current.startY)
      });
      return;
    }
    if (!draftTransform || !originalImage || !modifiedImage) return;
    if (dragRef.current.mode === "rotate") {
      setActiveGuides([]);
      const angle = Math.atan2(event.clientY - dragRef.current.centerY, event.clientX - dragRef.current.centerX);
      const nextRotation = dragRef.current.transform.rotationDeg + (angle - dragRef.current.startAngle) * 180 / Math.PI;
      setAlignmentDraftTransform({ ...dragRef.current.transform, rotationDeg: nextRotation });
      return;
    }
    if (dragRef.current.mode === "resize") {
      setActiveGuides([]);
      const nextDistance = Math.max(1, Math.hypot(event.clientX - dragRef.current.centerX, event.clientY - dragRef.current.centerY));
      if (alignment.aspectRatioLocked) {
        const factor = nextDistance / dragRef.current.startDistance;
        setAlignmentDraftTransform({
          ...dragRef.current.transform,
          scaleX: Math.max(0.01, dragRef.current.transform.scaleX * factor),
          scaleY: Math.max(0.01, dragRef.current.transform.scaleY * factor)
        });
        return;
      }

      const factorX = Math.max(0.01, Math.abs(event.clientX - dragRef.current.centerX) / dragRef.current.startHalfWidth);
      const factorY = Math.max(0.01, Math.abs(event.clientY - dragRef.current.centerY) / dragRef.current.startHalfHeight);
      setAlignmentDraftTransform({
        ...dragRef.current.transform,
        scaleX: Math.max(0.01, dragRef.current.transform.scaleX * factorX),
        scaleY: Math.max(0.01, dragRef.current.transform.scaleY * factorY)
      });
      return;
    }

    const nextTransform = {
      ...dragRef.current.transform,
      x: dragRef.current.transform.x + (event.clientX - dragRef.current.startX) / stageSize.scale,
      y: dragRef.current.transform.y + (event.clientY - dragRef.current.startY) / stageSize.scale
    };
    const shouldSnap = event.ctrlKey || event.metaKey ? !alignment.snappingEnabled : alignment.snappingEnabled;
    if (shouldSnap) {
      const snapResult = getSnapResult(nextTransform, originalImage.width, originalImage.height, modifiedImage.width, modifiedImage.height, stageSize.scale);
      setActiveGuides(snapResult.guides);
      setAlignmentDraftTransform(snapResult.transform);
      return;
    }
    setActiveGuides([]);
    setAlignmentDraftTransform(nextTransform);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setActiveGuides([]);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? 1.1 : 1 / 1.1;
    setAlignmentPreviewZoom(clampNumber(alignment.previewZoom * factor, 0.5, 5));
  };

  const updateScale = (scaleX: number, scaleY: number) => {
    if (!draftTransform || !modifiedImage) return;
    if (alignment.aspectRatioLocked) {
      const uniformScale = Math.max(0.01, scaleX);
      setAlignmentDraftTransform({ ...draftTransform, scaleX: uniformScale, scaleY: uniformScale });
      return;
    }
    setAlignmentDraftTransform({
      ...draftTransform,
      scaleX: Math.max(0.01, scaleX),
      scaleY: Math.max(0.01, scaleY)
    });
  };

  const runAutoAlign = async () => {
    if (!originalImage || !modifiedImage) return;
    setAlignmentStatus("aligning");
    const result = await estimateAutoAlignment(originalImage, modifiedImage, alignment.options);
    if (result.success && result.transform) {
      setAlignmentDraftTransform(result.transform);
      applyAlignmentTransform(result.transform, {
        method: "auto",
        confidence: result.confidence ?? null,
        matchCount: result.matchCount ?? null,
        timestamp: Date.now()
      });
      return;
    }
    setAlignmentError(
      result.error?.code ?? "alignment/failed",
      result.error?.message ?? "Auto align failed. Use manual alignment to place the images precisely."
    );
  };

  if (!alignment.isPanelOpen || !originalImage || !modifiedImage || !draftTransform) {
    return null;
  }

  const displayWidth = modifiedImage.width * draftTransform.scaleX;
  const displayHeight = modifiedImage.height * draftTransform.scaleY;
  const handleScaleX = 1 / Math.max(0.001, draftTransform.scaleX);
  const handleScaleY = 1 / Math.max(0.001, draftTransform.scaleY);
  const rotateHandleOffset = -34 * handleScaleY;
  const transformStyle = {
    left: `${draftTransform.x * stageSize.scale}px`,
    top: `${draftTransform.y * stageSize.scale}px`,
    width: `${modifiedImage.width * stageSize.scale}px`,
    height: `${modifiedImage.height * stageSize.scale}px`,
    opacity: alignment.opacity,
    transform: [
      "translate(-50%, -50%)",
      `rotate(${draftTransform.rotationDeg}deg)`,
      `scale(${draftTransform.scaleX * (draftTransform.flipX ? -1 : 1)}, ${draftTransform.scaleY * (draftTransform.flipY ? -1 : 1)})`
    ].join(" ")
  };
  const selectedOptions = getOptionValues(alignment.options);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/55 p-3 sm:p-5">
      <div className="flex min-h-0 w-full overflow-hidden rounded-lg border border-border-default bg-bg-primary shadow-xl">
        <div
          ref={stageRef}
          className={cn("relative min-w-0 flex-1 overflow-hidden bg-bg-secondary cursor-grab active:cursor-grabbing", isSpacePressed && "cursor-grabbing")}
          onWheel={handleWheel}
          onPointerDown={startPan}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="absolute left-1/2 top-1/2 select-none"
            style={{
              width: stageSize.width,
              height: stageSize.height,
              transform: `translate(-50%, -50%) translate(${viewportPan.x}px, ${viewportPan.y}px)`
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalImage.url}
              alt="Original"
              className="absolute inset-0 h-full w-full object-fill"
              draggable={false}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={modifiedImage.url}
              alt="Modified"
              className="absolute cursor-move object-fill"
              draggable={false}
              style={transformStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            <div
              ref={overlayRef}
              className="pointer-events-none absolute border border-accent-primary shadow-[0_0_0_1px_rgba(255,255,255,0.55)]"
              style={{ ...transformStyle, opacity: 1 }}
            >
              {[
                { className: "left-0 top-0 cursor-nwse-resize", transform: "translate(-50%, -50%)" },
                { className: "right-0 top-0 cursor-nesw-resize", transform: "translate(50%, -50%)" },
                { className: "right-0 bottom-0 cursor-nwse-resize", transform: "translate(50%, 50%)" },
                { className: "left-0 bottom-0 cursor-nesw-resize", transform: "translate(-50%, 50%)" }
              ].map((handle) => (
                <button
                  key={handle.className}
                  type="button"
                  className={cn("pointer-events-auto absolute h-3 w-3 border border-accent-primary bg-bg-primary shadow-sm", handle.className)}
                  style={{ transform: `${handle.transform} scale(${handleScaleX}, ${handleScaleY})` }}
                  onPointerDown={handleResizePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              ))}
              <button
                type="button"
                className="pointer-events-auto absolute left-1/2 top-0 flex h-7 w-7 cursor-grab items-center justify-center rounded-full text-accent-primary hover:bg-hover-overlay active:cursor-grabbing"
                style={{
                  top: `${rotateHandleOffset}px`,
                  transform: `translateX(-50%) scale(${handleScaleX}, ${handleScaleY})`
                }}
                onPointerDown={handleRotatePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <MdRotateRight className="text-xl" />
              </button>
            </div>
            {alignment.snappingEnabled && (
              <>
                <span className="pointer-events-none absolute top-0 bottom-0 w-px bg-accent-primary/30" style={{ left: stageSize.width / 2 }} />
                <span className="pointer-events-none absolute left-0 right-0 h-px bg-accent-primary/30" style={{ top: stageSize.height / 2 }} />
                {activeGuides.map((guide, index) => (
                  <span
                    key={`${guide.axis}-${guide.position}-${index}`}
                    className={cn(
                      "pointer-events-none absolute bg-accent-primary shadow-[0_0_0_1px_rgba(255,255,255,0.75),0_0_10px_rgba(59,130,246,0.45)]",
                      guide.axis === "x" ? "top-0 bottom-0 w-0.5" : "left-0 right-0 h-0.5"
                    )}
                    style={guide.axis === "x" ? { left: guide.position * stageSize.scale } : { top: guide.position * stageSize.scale }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <aside className="flex w-full max-w-sm flex-col border-l border-border-default bg-bg-primary max-lg:max-w-xs max-md:absolute max-md:inset-y-3 max-md:right-3 max-md:left-3 max-md:max-w-none max-md:rounded-lg max-md:border">
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
            <h2 className="text-base font-bold text-text-primary">Align Images</h2>
            <button type="button" onClick={closeAlignmentPanel} className="ml-auto rounded p-1.5 text-text-secondary hover:bg-hover-overlay hover:text-text-primary">
              <MdClose className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {alignment.error && (
              <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {alignment.error.message}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={resetAlignmentDraft} leftIcon={<MdRestartAlt className="text-lg" />}>
                Reset
              </Button>
              <Button variant="danger" size="sm" onClick={resetAlignment} leftIcon={<MdDelete className="text-lg" />}>
                Clear alignment
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-md border border-border-default bg-bg-secondary px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Zoom</span>
              <span className="text-sm font-bold text-text-primary">{formatPercent(alignment.previewZoom)}</span>
              <Button variant="outline" size="sm" onClick={() => setAlignmentPreviewZoom(1)} leftIcon={<MdRestartAlt className="text-lg" />}>
                Reset
              </Button>
            </div>

            <section className="mt-6 border-t border-border-default pt-5">
              <h3 className="text-sm font-bold text-text-primary">Auto Align</h3>
              <p className="mt-1 text-xs text-text-secondary">Allowed transformations</p>
              <SelectionBar<TransformOption>
                selectionMode="multiple"
                value={selectedOptions}
                options={TRANSFORM_OPTIONS}
                onChange={(values) => updateAlignmentOptions({
                  rotate: values.includes("rotate"),
                  scale: values.includes("scale"),
                  warp: false
                })}
                className="mt-3"
                buttonClassName="px-2"
              />
              <Button className="mt-3 w-full" onClick={runAutoAlign} disabled={alignment.status === "aligning"}>
                {alignment.status === "aligning" ? "Aligning..." : "Auto Align Images"}
              </Button>
            </section>

            <section className="mt-6 border-t border-border-default pt-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-text-primary">Align Manually</h3>
                <Button
                  variant={alignment.snappingEnabled ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setAlignmentSnappingEnabled(!alignment.snappingEnabled)}
                  title="Hold Ctrl or Command while dragging to temporarily toggle"
                >
                  Snap: {alignment.snappingEnabled ? "on" : "off"}
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlignmentDraftTransform({ ...draftTransform, flipY: !draftTransform.flipY })}
                  leftIcon={<MdFlip className="rotate-90 text-lg" />}
                >
                  Vertical
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlignmentDraftTransform({ ...draftTransform, flipX: !draftTransform.flipX })}
                  leftIcon={<MdFlip className="text-lg" />}
                >
                  Horizontal
                </Button>
              </div>

              <div className="mt-4">
                <NumberField
                  label="Rotate"
                  value={draftTransform.rotationDeg}
                  step={0.1}
                  suffix="deg"
                  onChange={(value) => setAlignmentDraftTransform({ ...draftTransform, rotationDeg: value })}
                />
              </div>

              <div className="mt-5 rounded-md border border-border-default bg-bg-secondary p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-text-secondary">Transformation</h4>
                  <button
                    type="button"
                    onClick={() => setAlignmentAspectRatioLocked(!alignment.aspectRatioLocked)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md border border-border-default bg-bg-primary text-text-secondary hover:bg-hover-overlay hover:text-text-primary",
                      alignment.aspectRatioLocked && "text-accent-primary"
                    )}
                    title={alignment.aspectRatioLocked ? "Unlock proportional scale" : "Lock proportional scale"}
                  >
                    {alignment.aspectRatioLocked ? <MdLock className="text-lg" /> : <MdLockOpen className="text-lg" />}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <NumberField
                    label="Width"
                    value={displayWidth}
                    step={1}
                    suffix="px"
                    onChange={(value) => updateScale(value / modifiedImage.width, alignment.aspectRatioLocked ? value / modifiedImage.width : draftTransform.scaleY)}
                  />
                  <NumberField
                    label="Width"
                    value={draftTransform.scaleX * 100}
                    step={0.5}
                    suffix="%"
                    onChange={(value) => updateScale(value / 100, alignment.aspectRatioLocked ? value / 100 : draftTransform.scaleY)}
                  />
                  <NumberField
                    label="Height"
                    value={displayHeight}
                    step={1}
                    suffix="px"
                    onChange={(value) => updateScale(alignment.aspectRatioLocked ? value / modifiedImage.height : draftTransform.scaleX, value / modifiedImage.height)}
                  />
                  <NumberField
                    label="Height"
                    value={draftTransform.scaleY * 100}
                    step={0.5}
                    suffix="%"
                    onChange={(value) => updateScale(alignment.aspectRatioLocked ? value / 100 : draftTransform.scaleX, value / 100)}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-default p-4">
            <Button variant="ghost" onClick={closeAlignmentPanel}>
              Cancel
            </Button>
            <Button
              onClick={() => applyAlignmentTransform(draftTransform, {
                method: "manual",
                confidence: null,
                matchCount: null,
                timestamp: Date.now()
              })}
            >
              Apply
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}

function formatNumberFieldValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(2)).toString();
}

function NumberField({ label, value, step, suffix, onChange }: NumberFieldProps) {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputValue = draftValue ?? formatNumberFieldValue(value);

  const commitValue = () => {
    const normalizedValue = Number(inputValue.replace(",", "."));
    if (!Number.isFinite(normalizedValue)) {
      setDraftValue(null);
      return;
    }
    const clampedValue = clampNumber(normalizedValue, -100000, 100000);
    setDraftValue(null);
    onChange(clampedValue);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
      <span className="flex items-center overflow-hidden rounded-md border border-border-default bg-bg-secondary">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          step={step}
          onFocus={() => setDraftValue(formatNumberFieldValue(value))}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraftValue(null);
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none"
        />
        <span className="border-l border-border-default px-2 text-xs font-semibold text-text-secondary">{suffix}</span>
      </span>
    </label>
  );
}
