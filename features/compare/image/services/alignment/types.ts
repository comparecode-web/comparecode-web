export interface ImageAffineTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotationDeg: number;
  flipX: boolean;
  flipY: boolean;
}

export interface ImageAlignmentOptions {
  rotate: boolean;
  scale: boolean;
  warp: boolean;
}

export interface ImageAlignmentError {
  code: string;
  message: string;
}

export type ImageAlignmentStatus = "idle" | "prompt" | "aligning" | "aligned" | "failed";

export interface ImageAlignmentMetadata {
  method: "manual" | "auto";
  confidence: number | null;
  matchCount: number | null;
  timestamp: number;
}

export interface ImageAlignmentState {
  status: ImageAlignmentStatus;
  isPromptOpen: boolean;
  isPanelOpen: boolean;
  promptPairKey: string | null;
  skippedPairKey: string | null;
  appliedTransform: ImageAffineTransform | null;
  draftTransform: ImageAffineTransform | null;
  options: ImageAlignmentOptions;
  opacity: number;
  previewZoom: number;
  snappingEnabled: boolean;
  aspectRatioLocked: boolean;
  metadata: ImageAlignmentMetadata | null;
  error: ImageAlignmentError | null;
}

export interface ImageAlignmentSnapshot {
  transform: ImageAffineTransform | null;
  metadata: ImageAlignmentMetadata | null;
}

export const DEFAULT_ALIGNMENT_OPTIONS: ImageAlignmentOptions = {
  rotate: true,
  scale: true,
  warp: false
};

export const DEFAULT_ALIGNMENT_STATE: ImageAlignmentState = {
  status: "idle",
  isPromptOpen: false,
  isPanelOpen: false,
  promptPairKey: null,
  skippedPairKey: null,
  appliedTransform: null,
  draftTransform: null,
  options: DEFAULT_ALIGNMENT_OPTIONS,
  opacity: 0.5,
  previewZoom: 1,
  snappingEnabled: true,
  aspectRatioLocked: true,
  metadata: null,
  error: null
};
