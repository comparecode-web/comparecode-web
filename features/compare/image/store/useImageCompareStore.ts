import { create } from "zustand";
import {
  DEFAULT_ALIGNMENT_STATE,
  ImageAffineTransform,
  ImageAlignmentMetadata,
  ImageAlignmentOptions,
  ImageAlignmentState
} from "../services/alignment/types";
import { createDefaultAlignmentTransform, normalizeTransform } from "../services/alignment/transformUtils";

export type ImageCompareMode = "side-by-side" | "fade" | "slider" | "diff";
export type DiffAlgorithm =
  | "absolute" | "subtract" | "highlight" | "xor"
  | "perceptual" | "heatmap" | "ssim" | "edge" | "threshold" | "channel-split";

export interface ImageFileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  width: number;
  height: number;
  url: string;
  exif: Record<string, string> | null;
}

interface ImageCompareState {
  originalImage: ImageFileMeta | null;
  modifiedImage: ImageFileMeta | null;
  compareMode: ImageCompareMode;
  diffAlgorithm: DiffAlgorithm;
  fadeValue: number;
  sliderPosition: number;
  isMetadataPanelOpen: boolean;
  alignment: ImageAlignmentState;

  setOriginalImage: (img: ImageFileMeta | null) => void;
  setModifiedImage: (img: ImageFileMeta | null) => void;
  setCompareMode: (mode: ImageCompareMode) => void;
  setDiffAlgorithm: (algo: DiffAlgorithm) => void;
  setFadeValue: (value: number) => void;
  setSliderPosition: (pos: number) => void;
  setIsMetadataPanelOpen: (open: boolean) => void;
  toggleMetadataPanel: () => void;
  openAlignmentPrompt: (pairKey: string) => void;
  skipAlignmentPrompt: (pairKey: string) => void;
  openAlignmentPanel: () => void;
  closeAlignmentPanel: () => void;
  setAlignmentStatus: (status: ImageAlignmentState["status"]) => void;
  setAlignmentError: (code: string, message: string) => void;
  updateAlignmentOptions: (options: Partial<ImageAlignmentOptions>) => void;
  setAlignmentOpacity: (value: number) => void;
  setAlignmentPreviewZoom: (value: number) => void;
  setAlignmentSnappingEnabled: (enabled: boolean) => void;
  setAlignmentAspectRatioLocked: (locked: boolean) => void;
  setAlignmentDraftTransform: (transform: ImageAffineTransform) => void;
  resetAlignmentDraft: () => void;
  applyAlignmentTransform: (transform: ImageAffineTransform, metadata: ImageAlignmentMetadata) => void;
  restoreAlignmentTransform: (transform: ImageAffineTransform | null, metadata: ImageAlignmentMetadata | null) => void;
  resetAlignment: () => void;
  clearAll: () => void;
}

const canRevokeObjectUrl = typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function";

function revokeObjectUrl(url: string | null | undefined): void {
  if (!canRevokeObjectUrl || !url || !url.startsWith("blob:")) return;
  URL.revokeObjectURL(url);
}

function revokeUniqueObjectUrls(urls: Array<string | null | undefined>): void {
  const uniqueUrls = new Set(urls.filter((url): url is string => Boolean(url && url.startsWith("blob:"))));
  uniqueUrls.forEach((url) => revokeObjectUrl(url));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneDefaultAlignmentState(): ImageAlignmentState {
  return {
    ...DEFAULT_ALIGNMENT_STATE,
    options: { ...DEFAULT_ALIGNMENT_STATE.options }
  };
}

function resetAlignmentForImages(state: ImageCompareState): Partial<ImageCompareState> {
  return {
    alignment: {
      ...cloneDefaultAlignmentState(),
      skippedPairKey: state.alignment.skippedPairKey
    }
  };
}

export const useImageCompareStore = create<ImageCompareState>((set) => ({
  originalImage: null,
  modifiedImage: null,
  compareMode: "side-by-side",
  diffAlgorithm: "highlight",
  fadeValue: 500,
  sliderPosition: 0.5,
  isMetadataPanelOpen: false,
  alignment: cloneDefaultAlignmentState(),

  setOriginalImage: (img) => set((state) => {
    const previousUrl = state.originalImage?.url;
    const nextUrl = img?.url;
    if (previousUrl && previousUrl !== nextUrl && previousUrl !== state.modifiedImage?.url) {
      revokeObjectUrl(previousUrl);
    }
    const shouldResetAlignment =
      previousUrl !== nextUrl
      || state.originalImage?.width !== img?.width
      || state.originalImage?.height !== img?.height
      || state.originalImage?.name !== img?.name;
    return {
      originalImage: img,
      ...(shouldResetAlignment ? resetAlignmentForImages(state) : {})
    };
  }),
  setModifiedImage: (img) => set((state) => {
    const previousUrl = state.modifiedImage?.url;
    const nextUrl = img?.url;
    if (previousUrl && previousUrl !== nextUrl && previousUrl !== state.originalImage?.url) {
      revokeObjectUrl(previousUrl);
    }
    const shouldResetAlignment =
      previousUrl !== nextUrl
      || state.modifiedImage?.width !== img?.width
      || state.modifiedImage?.height !== img?.height
      || state.modifiedImage?.name !== img?.name;
    return {
      modifiedImage: img,
      ...(shouldResetAlignment ? resetAlignmentForImages(state) : {})
    };
  }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setDiffAlgorithm: (algo) => set({ diffAlgorithm: algo }),
  setFadeValue: (value) => set({ fadeValue: clamp(value, 0, 1000) }),
  setSliderPosition: (pos) => set({ sliderPosition: clamp(pos, 0, 1) }),
  setIsMetadataPanelOpen: (open) => set({ isMetadataPanelOpen: open }),
  toggleMetadataPanel: () => set((state) => ({ isMetadataPanelOpen: !state.isMetadataPanelOpen })),
  openAlignmentPrompt: (pairKey) => set((state) => ({
    alignment: {
      ...state.alignment,
      status: "prompt",
      isPromptOpen: true,
      promptPairKey: pairKey,
      error: null
    }
  })),
  skipAlignmentPrompt: (pairKey) => set((state) => ({
    compareMode: "slider",
    alignment: {
      ...state.alignment,
      status: "idle",
      isPromptOpen: false,
      promptPairKey: pairKey,
      skippedPairKey: pairKey
    }
  })),
  openAlignmentPanel: () => set((state) => {
    const { originalImage, modifiedImage, alignment } = state;
    const draftTransform = alignment.draftTransform
      ?? alignment.appliedTransform
      ?? (originalImage && modifiedImage ? createDefaultAlignmentTransform(originalImage, modifiedImage) : null);

    return {
      alignment: {
        ...alignment,
        isPanelOpen: true,
        draftTransform,
        isPromptOpen: false,
        error: null
      }
    };
  }),
  closeAlignmentPanel: () => set((state) => ({
    alignment: {
      ...state.alignment,
      isPanelOpen: false
    }
  })),
  setAlignmentStatus: (status) => set((state) => ({
    alignment: {
      ...state.alignment,
      status
    }
  })),
  setAlignmentError: (code, message) => set((state) => ({
    alignment: {
      ...state.alignment,
      status: "failed",
      error: { code, message },
      isPanelOpen: true,
      isPromptOpen: false
    }
  })),
  updateAlignmentOptions: (options) => set((state) => {
    const nextOptions = {
      ...state.alignment.options,
      ...options
    };
    if (nextOptions.warp) {
      nextOptions.scale = true;
      nextOptions.rotate = true;
    }

    return {
      alignment: {
        ...state.alignment,
        options: nextOptions
      }
    };
  }),
  setAlignmentOpacity: (value) => set((state) => ({
    alignment: {
      ...state.alignment,
      opacity: clamp(value, 0, 1)
    }
  })),
  setAlignmentPreviewZoom: (value) => set((state) => ({
    alignment: {
      ...state.alignment,
      previewZoom: clamp(value, 0.5, 5)
    }
  })),
  setAlignmentSnappingEnabled: (enabled) => set((state) => ({
    alignment: {
      ...state.alignment,
      snappingEnabled: enabled
    }
  })),
  setAlignmentAspectRatioLocked: (locked) => set((state) => ({
    alignment: {
      ...state.alignment,
      aspectRatioLocked: locked
    }
  })),
  setAlignmentDraftTransform: (transform) => set((state) => ({
    alignment: {
      ...state.alignment,
      draftTransform: normalizeTransform(transform)
    }
  })),
  resetAlignmentDraft: () => set((state) => {
    const { originalImage, modifiedImage, alignment } = state;
    return {
      alignment: {
        ...alignment,
        draftTransform: originalImage && modifiedImage ? createDefaultAlignmentTransform(originalImage, modifiedImage) : null,
        error: null
      }
    };
  }),
  applyAlignmentTransform: (transform, metadata) => set((state) => ({
    compareMode: "slider",
    alignment: {
      ...state.alignment,
      status: "aligned",
      isPanelOpen: false,
      isPromptOpen: false,
      appliedTransform: normalizeTransform(transform),
      draftTransform: normalizeTransform(transform),
      metadata,
      error: null
    }
  })),
  restoreAlignmentTransform: (transform, metadata) => set((state) => ({
    alignment: {
      ...state.alignment,
      status: transform ? "aligned" : "idle",
      appliedTransform: transform ? normalizeTransform(transform) : null,
      draftTransform: transform ? normalizeTransform(transform) : null,
      metadata,
      error: null,
      isPromptOpen: false,
      isPanelOpen: false
    }
  })),
  resetAlignment: () => set((state) => ({
    alignment: {
      ...cloneDefaultAlignmentState(),
      skippedPairKey: state.alignment.skippedPairKey
    }
  })),
  clearAll: () => set((state) => {
    revokeUniqueObjectUrls([state.originalImage?.url, state.modifiedImage?.url]);
    return {
      originalImage: null,
      modifiedImage: null,
      compareMode: "side-by-side",
      diffAlgorithm: "highlight",
      fadeValue: 500,
      sliderPosition: 0.5,
      isMetadataPanelOpen: false,
      alignment: cloneDefaultAlignmentState()
    };
  })
}));
