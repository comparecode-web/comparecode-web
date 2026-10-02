import { describe, expect, it } from "vitest";
import {
  hasSameAspectRatio,
  createDefaultAlignmentTransform,
  imagesNeedAlignmentPrompt
} from "../transformUtils";
import type { ImageFileMeta } from "../../../store/useImageCompareStore";

const baseMeta: ImageFileMeta = {
  name: "test.png",
  size: 1024,
  type: "image/png",
  lastModified: 1000,
  width: 1910,
  height: 1098,
  url: "blob:test",
  exif: null
};

describe("transformUtils aspect ratio and prompt logic", () => {
  it("starts manual alignment centered at natural size without assuming a scale from dimensions", () => {
    expect(createDefaultAlignmentTransform({ ...baseMeta, width: 640, height: 360 }, { ...baseMeta, width: 320, height: 180 }))
      .toMatchObject({ x: 320, y: 180, scaleX: 1, scaleY: 1 });
  });
  describe("hasSameAspectRatio", () => {
    it("returns true for identical dimensions", () => {
      expect(hasSameAspectRatio(1920, 1080, 1920, 1080)).toBe(true);
    });

    it("returns true for matching 16:9 ratios with different dimensions", () => {
      expect(hasSameAspectRatio(3840, 2160, 1920, 1080)).toBe(true);
      expect(hasSameAspectRatio(1920, 1080, 1280, 720)).toBe(true);
    });

    it("returns true for virtually identical aspect ratios like 1910x1098 and 1024x590", () => {
      expect(hasSameAspectRatio(1910, 1098, 1024, 590)).toBe(true);
    });

    it("returns false for different aspect ratios", () => {
      expect(hasSameAspectRatio(1920, 1080, 1000, 1000)).toBe(false);
      expect(hasSameAspectRatio(1920, 1080, 1024, 768)).toBe(false);
    });

    it("returns false for non-positive dimensions", () => {
      expect(hasSameAspectRatio(0, 1080, 1920, 1080)).toBe(false);
      expect(hasSameAspectRatio(1920, -100, 1920, 1080)).toBe(false);
    });
  });

  describe("imagesNeedAlignmentPrompt", () => {
    it("returns false when images are identical dimensions", () => {
      const orig = { ...baseMeta, width: 1920, height: 1080 };
      const mod = { ...baseMeta, width: 1920, height: 1080 };
      expect(imagesNeedAlignmentPrompt(orig, mod)).toBe(false);
    });

    it("offers alignment for different resolutions even when aspect ratios match", () => {
      const orig = { ...baseMeta, width: 1910, height: 1098 };
      const mod = { ...baseMeta, width: 1024, height: 590 };
      expect(imagesNeedAlignmentPrompt(orig, mod)).toBe(true);

      const orig4k = { ...baseMeta, width: 3840, height: 2160 };
      const mod1080 = { ...baseMeta, width: 1920, height: 1080 };
      expect(imagesNeedAlignmentPrompt(orig4k, mod1080)).toBe(true);
    });

    it("returns true when images have different aspect ratios", () => {
      const orig = { ...baseMeta, width: 1920, height: 1080 };
      const mod = { ...baseMeta, width: 800, height: 800 };
      expect(imagesNeedAlignmentPrompt(orig, mod)).toBe(true);

      const origWide = { ...baseMeta, width: 1920, height: 1080 };
      const modStandard = { ...baseMeta, width: 1024, height: 768 };
      expect(imagesNeedAlignmentPrompt(origWide, modStandard)).toBe(true);
    });

    it("returns false when an image is missing", () => {
      expect(imagesNeedAlignmentPrompt(null, baseMeta)).toBe(false);
      expect(imagesNeedAlignmentPrompt(baseMeta, null)).toBe(false);
      expect(imagesNeedAlignmentPrompt(null, null)).toBe(false);
    });
  });
});
