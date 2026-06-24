import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_ALIGNMENT_STATE } from "@/features/compare/image/services/alignment/types";
import { useImageCompareStore } from "@/features/compare/image/store/useImageCompareStore";

const originalImage = {
  name: "original.png",
  size: 100,
  type: "image/png",
  lastModified: 1,
  width: 100,
  height: 80,
  url: "blob:original",
  exif: null
};

const modifiedImage = {
  name: "modified.png",
  size: 100,
  type: "image/png",
  lastModified: 1,
  width: 90,
  height: 70,
  url: "blob:modified",
  exif: null
};

describe("useImageCompareStore alignment", () => {
  beforeEach(() => {
    useImageCompareStore.setState({
      originalImage,
      modifiedImage,
      alignment: {
        ...DEFAULT_ALIGNMENT_STATE,
        options: { ...DEFAULT_ALIGNMENT_STATE.options },
        isPanelOpen: true,
        snappingEnabled: false,
        aspectRatioLocked: false,
        draftTransform: {
          x: 25,
          y: 35,
          scaleX: 1.5,
          scaleY: 0.75,
          rotationDeg: 15,
          flipX: true,
          flipY: false
        }
      }
    });
  });

  it("resets manual alignment controls to their defaults", () => {
    useImageCompareStore.getState().resetAlignmentDraft();

    const alignment = useImageCompareStore.getState().alignment;

    expect(alignment.snappingEnabled).toBe(DEFAULT_ALIGNMENT_STATE.snappingEnabled);
    expect(alignment.aspectRatioLocked).toBe(DEFAULT_ALIGNMENT_STATE.aspectRatioLocked);
    expect(alignment.draftTransform?.rotationDeg).toBe(0);
    expect(alignment.draftTransform?.flipX).toBe(false);
  });
});
