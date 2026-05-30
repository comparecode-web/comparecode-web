import { create } from "zustand";

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

  setOriginalImage: (img: ImageFileMeta | null) => void;
  setModifiedImage: (img: ImageFileMeta | null) => void;
  setCompareMode: (mode: ImageCompareMode) => void;
  setDiffAlgorithm: (algo: DiffAlgorithm) => void;
  setFadeValue: (value: number) => void;
  setSliderPosition: (pos: number) => void;
  setIsMetadataPanelOpen: (open: boolean) => void;
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

export const useImageCompareStore = create<ImageCompareState>((set) => ({
  originalImage: null,
  modifiedImage: null,
  compareMode: "side-by-side",
  diffAlgorithm: "highlight",
  fadeValue: 500,
  sliderPosition: 0.5,
  isMetadataPanelOpen: false,

  setOriginalImage: (img) => set((state) => {
    const previousUrl = state.originalImage?.url;
    const nextUrl = img?.url;
    if (previousUrl && previousUrl !== nextUrl && previousUrl !== state.modifiedImage?.url) {
      revokeObjectUrl(previousUrl);
    }
    return { originalImage: img };
  }),
  setModifiedImage: (img) => set((state) => {
    const previousUrl = state.modifiedImage?.url;
    const nextUrl = img?.url;
    if (previousUrl && previousUrl !== nextUrl && previousUrl !== state.originalImage?.url) {
      revokeObjectUrl(previousUrl);
    }
    return { modifiedImage: img };
  }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setDiffAlgorithm: (algo) => set({ diffAlgorithm: algo }),
  setFadeValue: (value) => set({ fadeValue: clamp(value, 0, 1000) }),
  setSliderPosition: (pos) => set({ sliderPosition: clamp(pos, 0, 1) }),
  setIsMetadataPanelOpen: (open) => set({ isMetadataPanelOpen: open }),
  clearAll: () => set((state) => {
    revokeUniqueObjectUrls([state.originalImage?.url, state.modifiedImage?.url]);
    return {
      originalImage: null,
      modifiedImage: null,
      compareMode: "side-by-side",
      diffAlgorithm: "highlight",
      fadeValue: 500,
      sliderPosition: 0.5,
      isMetadataPanelOpen: false
    };
  })
}));
