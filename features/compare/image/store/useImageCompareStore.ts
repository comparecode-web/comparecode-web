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

export const useImageCompareStore = create<ImageCompareState>((set) => ({
  originalImage: null,
  modifiedImage: null,
  compareMode: "side-by-side",
  diffAlgorithm: "highlight",
  fadeValue: 500,
  sliderPosition: 50,
  isMetadataPanelOpen: false,

  setOriginalImage: (img) => set({ originalImage: img }),
  setModifiedImage: (img) => set({ modifiedImage: img }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setDiffAlgorithm: (algo) => set({ diffAlgorithm: algo }),
  setFadeValue: (value) => set({ fadeValue: value }),
  setSliderPosition: (pos) => set({ sliderPosition: pos }),
  setIsMetadataPanelOpen: (open) => set({ isMetadataPanelOpen: open }),
  clearAll: () => set({
    originalImage: null,
    modifiedImage: null,
    compareMode: "side-by-side",
    diffAlgorithm: "highlight",
    fadeValue: 500,
    sliderPosition: 50,
    isMetadataPanelOpen: false
  })
}));
