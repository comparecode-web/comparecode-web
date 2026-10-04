"use client";

import { PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdFlip, MdLock, MdLockOpen, MdRotateRight } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { AutoAlignButton } from "./AutoAlignButton";
import { AlignmentWorkspace } from "./AlignmentWorkspace";
import { cn } from "@/utils/uiHelpers";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { DEFAULT_ALIGNMENT_OPTIONS, DEFAULT_ALIGNMENT_STATE, ImageAffineTransform, isAutoAlignmentAvailable } from "../../services/alignment/types";
import { clampNumber, createDefaultAlignmentTransform, getTransformedBounds, normalizeTransform } from "../../services/alignment/transformUtils";

type TransformOption = "rotate" | "scale";

const TRANSFORM_OPTIONS: Array<{ value: TransformOption; label: string }> = [
  { value: "rotate", label: "Rotate" },
  { value: "scale", label: "Scale" }
];

interface StageSize {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
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

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

function areNumbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.0001;
}

function areTransformsEqual(left: ImageAffineTransform | null, right: ImageAffineTransform | null): boolean {
  if (!left || !right) {
    return left === right;
  }

  const normalizedLeft = normalizeTransform(left);
  const normalizedRight = normalizeTransform(right);

  return areNumbersEqual(normalizedLeft.x, normalizedRight.x)
    && areNumbersEqual(normalizedLeft.y, normalizedRight.y)
    && areNumbersEqual(normalizedLeft.scaleX, normalizedRight.scaleX)
    && areNumbersEqual(normalizedLeft.scaleY, normalizedRight.scaleY)
    && areNumbersEqual(normalizedLeft.rotationDeg, normalizedRight.rotationDeg)
    && normalizedLeft.flipX === normalizedRight.flipX
    && normalizedLeft.flipY === normalizedRight.flipY;
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
  const setAlignmentOpacity = useImageCompareStore((s) => s.setAlignmentOpacity);
  const setAlignmentSnappingEnabled = useImageCompareStore((s) => s.setAlignmentSnappingEnabled);
  const setAlignmentAspectRatioLocked = useImageCompareStore((s) => s.setAlignmentAspectRatioLocked);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<StageSize>({ width: 1, height: 1, scale: 1, offsetX: 0, offsetY: 0 });
  const [viewportPan, setViewportPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [sizeUnit, setSizeUnit] = useState<"%" | "px">("%");
  const dragRef = useRef<DragState | null>(null);

  const draftTransform = useMemo(() => {
    if (!originalImage || !modifiedImage) return null;
    return alignment.draftTransform ?? alignment.appliedTransform ?? createDefaultAlignmentTransform(originalImage, modifiedImage);
  }, [alignment.appliedTransform, alignment.draftTransform, modifiedImage, originalImage]);

  useEffect(() => {
    if (alignment.isPanelOpen && alignment.error) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [alignment.error, alignment.isPanelOpen]);

  useEffect(() => {
    if (!alignment.isPanelOpen || !originalImage || !modifiedImage || !stageRef.current) return;

    const resize = () => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const bounds = getTransformedBounds(alignment.appliedTransform ?? createDefaultAlignmentTransform(originalImage, modifiedImage), modifiedImage.width, modifiedImage.height);
      const minX = Math.min(0, bounds.x), minY = Math.min(0, bounds.y);
      const maxX = Math.max(originalImage.width, bounds.x + bounds.width);
      const maxY = Math.max(originalImage.height, bounds.y + bounds.height);
      const padding = parseFloat(getComputedStyle(stageRef.current!).paddingLeft) * 2;
      const scale = Math.min(Math.max(1, rect.width - padding) / (maxX - minX), Math.max(1, rect.height - padding) / (maxY - minY)) * alignment.previewZoom;
      setStageSize({
        width: originalImage.width * scale,
        height: originalImage.height * scale,
        scale,
        offsetX: (originalImage.width - maxX - minX) * scale / 2,
        offsetY: (originalImage.height - maxY - minY) * scale / 2
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stageRef.current);
    resize();

    return () => observer.disconnect();
  }, [alignment.appliedTransform, alignment.isPanelOpen, alignment.previewZoom, modifiedImage, originalImage]);

  useEffect(() => {
    if (!alignment.isPanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest("dialog") !== stageRef.current?.closest("dialog")) return;
      if (event.code === "Space" && event.target instanceof HTMLElement && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target.tagName)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
      if (!draftTransform || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [role=menu], [role=listbox]"))) return;
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

  if (!alignment.isPanelOpen || !originalImage || !modifiedImage || !draftTransform) {
    return null;
  }

  const displayWidth = modifiedImage.width * draftTransform.scaleX;
  const displayHeight = modifiedImage.height * draftTransform.scaleY;
  const widthPercent = roundToTwoDecimals(draftTransform.scaleX * 100);
  const heightPercent = roundToTwoDecimals(draftTransform.scaleY * 100);
  const defaultTransform = createDefaultAlignmentTransform(originalImage, modifiedImage);
  const isPreviewDirty = !areNumbersEqual(alignment.previewZoom, DEFAULT_ALIGNMENT_STATE.previewZoom)
    || !areNumbersEqual(alignment.opacity, DEFAULT_ALIGNMENT_STATE.opacity)
    || viewportPan.x !== 0 || viewportPan.y !== 0;
  const isManualAlignDirty =
    !areTransformsEqual(draftTransform, defaultTransform)
    || alignment.snappingEnabled !== DEFAULT_ALIGNMENT_STATE.snappingEnabled
    || alignment.aspectRatioLocked !== DEFAULT_ALIGNMENT_STATE.aspectRatioLocked;
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

  const preview = (
    <OptionsSection title="Preview" isDirty={isPreviewDirty} onReset={() => {
      setAlignmentPreviewZoom(DEFAULT_ALIGNMENT_STATE.previewZoom);
      setAlignmentOpacity(DEFAULT_ALIGNMENT_STATE.opacity);
      setViewportPan({ x: 0, y: 0 });
    }}>
      <Slider label="Zoom" aria-label="Preview zoom" min={50} max={500} step="5"
        value={Math.round(alignment.previewZoom * 100)} displayValue={formatPercent(alignment.previewZoom)}
        onChange={event => setAlignmentPreviewZoom(Number(event.target.value) / 100)} />
      <Slider label="Overlay opacity" aria-label="Overlay opacity" min={0} max={100}
        value={Math.round(alignment.opacity * 100)} displayValue={formatPercent(alignment.opacity)}
        onChange={event => setAlignmentOpacity(Number(event.target.value) / 100)} />
    </OptionsSection>
  );

  const automatic = (
    <OptionsSection title="Auto align"
      isDirty={alignment.options.rotate !== DEFAULT_ALIGNMENT_OPTIONS.rotate || alignment.options.scale !== DEFAULT_ALIGNMENT_OPTIONS.scale || alignment.options.warp !== DEFAULT_ALIGNMENT_OPTIONS.warp}
      onReset={() => updateAlignmentOptions(DEFAULT_ALIGNMENT_OPTIONS)}>
      <p className="text-xs text-text-secondary">Allowed transformations</p>
      <SelectionBar<TransformOption>
        selectionMode="multiple"
        value={selectedOptions}
        options={TRANSFORM_OPTIONS}
        onChange={values => updateAlignmentOptions({ rotate: values.includes("rotate"), scale: values.includes("scale"), warp: false })}
        buttonClassName="px-2"
      />
      <AutoAlignButton className="w-full" />
      {!isAutoAlignmentAvailable(alignment.options) && (
        <p className="text-xs text-text-secondary">Enable Rotate or Scale to use auto align.</p>
      )}
    </OptionsSection>
  );

  const manual = (
    <OptionsSection title="Manual adjustments" isDirty={isManualAlignDirty} onReset={resetAlignmentDraft}>
      <Slider
        min={-180}
        max={180}
        step="0.1"
        value={draftTransform.rotationDeg}
        onChange={(event) => setAlignmentDraftTransform({ ...draftTransform, rotationDeg: Number(event.target.value) })}
        label="Rotation"
        aria-label="Rotation"
        displayValue={`${Number(draftTransform.rotationDeg.toFixed(1))}°`}
        containerClassName="mt-3"
      />

      <div className="mt-3 border-t border-border-default pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-text-primary">Size</h4>
          <div className="flex items-center gap-2">
            <SelectionBar<"%" | "px">
              value={sizeUnit}
              options={[{ value: "%", label: "%" }, { value: "px", label: "px" }]}
              onChange={setSizeUnit}
              buttonClassName="px-2"
            />
            <IconButton
              onClick={() => setAlignmentAspectRatioLocked(!alignment.aspectRatioLocked)}
              size="sm"
              isActive={alignment.aspectRatioLocked}
              aria-pressed={alignment.aspectRatioLocked}
              title={alignment.aspectRatioLocked ? "Unlock proportional scale" : "Lock proportional scale"}
            >
              {alignment.aspectRatioLocked ? <MdLock /> : <MdLockOpen />}
            </IconButton>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField
            key={`width-${sizeUnit}`}
            label="Width"
            value={sizeUnit === "px" ? displayWidth : widthPercent}
            step={sizeUnit === "px" ? 1 : 0.5}
            suffix={sizeUnit}
            onChange={(value) => {
              const scale = value / (sizeUnit === "px" ? modifiedImage.width : 100);
              updateScale(scale, alignment.aspectRatioLocked ? scale : draftTransform.scaleY);
            }}
          />
          <NumberField
            key={`height-${sizeUnit}`}
            label="Height"
            value={sizeUnit === "px" ? displayHeight : heightPercent}
            step={sizeUnit === "px" ? 1 : 0.5}
            suffix={sizeUnit}
            onChange={(value) => {
              const scale = value / (sizeUnit === "px" ? modifiedImage.height : 100);
              updateScale(alignment.aspectRatioLocked ? scale : draftTransform.scaleX, scale);
            }}
          />
        </div>
        <div className="mt-3 grid gap-3">
          <Slider
            min={1}
            max={Math.max(300, widthPercent)}
            step="0.01"
            value={widthPercent}
            onChange={(event) => updateScale(Number(event.target.value) / 100, alignment.aspectRatioLocked ? Number(event.target.value) / 100 : draftTransform.scaleY)}
            label={alignment.aspectRatioLocked ? "Scale" : "Width scale"}
            aria-label={alignment.aspectRatioLocked ? "Scale" : "Width scale"}
            displayValue={`${widthPercent}%`}
          />
          {!alignment.aspectRatioLocked && (
            <Slider
              min={1}
              max={Math.max(300, heightPercent)}
              step="0.01"
              value={heightPercent}
              onChange={(event) => updateScale(draftTransform.scaleX, Number(event.target.value) / 100)}
              label="Height scale"
              aria-label="Height scale"
              displayValue={`${heightPercent}%`}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border-default pt-3">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={draftTransform.flipX}
          onClick={() => setAlignmentDraftTransform({ ...draftTransform, flipX: !draftTransform.flipX })}
          leftIcon={<MdFlip />}
        >
          Flip horizontal
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={draftTransform.flipY}
          onClick={() => setAlignmentDraftTransform({ ...draftTransform, flipY: !draftTransform.flipY })}
          leftIcon={<MdFlip className="rotate-90" />}
        >
          Flip vertical
        </Button>
      </div>
      <Switch
        checked={alignment.snappingEnabled}
        onChange={(event) => setAlignmentSnappingEnabled(event.target.checked)}
        label="Snapping"
        title="Hold Ctrl or Command while dragging to temporarily toggle"
        containerClassName="mt-3"
      />
    </OptionsSection>
  );

  const stage = (
    <div
      ref={stageRef}
      className={cn("relative min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-secondary p-10 cursor-grab active:cursor-grabbing", isSpacePressed && "cursor-grabbing")}
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
          transform: `translate(-50%, -50%) translate(${viewportPan.x + stageSize.offsetX}px, ${viewportPan.y + stageSize.offsetY}px)`
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
          className="absolute max-w-none cursor-move object-fill"
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
  );

  return (
    <Dialog open={alignment.isPanelOpen} onOpenChange={open => { if (!open) closeAlignmentPanel(); }} aria-labelledby="alignment-panel-title" className="h-[calc(100dvh-1.5rem)] max-h-none w-[calc(100%-1.5rem)] overflow-hidden sm:h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)]">
      <div className="flex h-full min-h-0 flex-col">
        <DialogHeader title="Adjust alignment" titleId="alignment-panel-title" closeLabel="Close alignment panel" onClose={closeAlignmentPanel} className="shrink-0 py-3" />
        {alignment.error && (
          <div ref={errorRef} role="alert" className="shrink-0 border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {alignment.error.message}
          </div>
        )}
        <AlignmentWorkspace stage={stage} preview={preview} automatic={automatic} manual={manual} />
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border-default p-3">
          <Button variant="danger" onClick={resetAlignment} leftIcon={<MdDelete className="text-lg" />}>Reset alignment</Button>
          <div className="ml-auto flex justify-end gap-2">
            <Button variant="ghost" onClick={closeAlignmentPanel}>Cancel</Button>
            <Button onClick={() => applyAlignmentTransform(draftTransform, {
              method: "manual", confidence: null, matchCount: null, timestamp: Date.now()
            })}>Apply</Button>
          </div>
        </div>
      </div>
    </Dialog>
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
  const cancelCommit = useRef(false);
  const inputValue = draftValue ?? formatNumberFieldValue(value);

  const commitValue = () => {
    if (cancelCommit.current) {
      cancelCommit.current = false;
      setDraftValue(null);
      return;
    }
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
    <FormField label={label}>{field => (
      <span className="flex items-center overflow-hidden rounded-md border border-border-default bg-bg-secondary">
        <Input
          {...field}
          size="sm"
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
              event.preventDefault();
              event.stopPropagation();
              cancelCommit.current = true;
              setDraftValue(null);
              event.currentTarget.blur();
            }
          }}
          className="flex-1 rounded-none border-0 bg-transparent px-2 focus-visible:ring-inset"
        />
        <span className="border-l border-border-default px-2 text-xs font-semibold text-text-secondary">{suffix}</span>
      </span>
    )}</FormField>
  );
}
