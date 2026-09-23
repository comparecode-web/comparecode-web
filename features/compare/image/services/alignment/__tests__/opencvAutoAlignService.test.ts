import { describe, expect, it } from "vitest";
import { matToTransform } from "../opencvAutoAlignService";
import type { ImageFileMeta } from "../../../store/useImageCompareStore";

const baseMeta: ImageFileMeta = {
  name: "test.png",
  size: 1024,
  type: "image/png",
  lastModified: 1000,
  width: 1600,
  height: 900,
  url: "blob:test",
  exif: null
};

describe("opencvAutoAlignService matToTransform", () => {
  it("converts OpenCV matrix to affine transform for images with different work scales", () => {
    // Original full size: 1600x900, scaled to work size with scale = 0.5 (800x450)
    // Modified full size: 800x450, work scale = 1.0 (800x450)
    const original: ImageFileMeta = { ...baseMeta, width: 1600, height: 900 };
    const modified: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };

    // Identity in work coordinates with 10px X shift and 20px Y shift
    // [a, c, e, b, d, f] = [1, 0, 10, 0, 1, 20]
    const matrix = [1, 0, 10, 0, 1, 20];
    const originalScale = 0.5;
    const modifiedScale = 1.0;

    const transform = matToTransform(matrix, original, modified, originalScale, modifiedScale);

    expect(transform).not.toBeNull();
    if (!transform) return;

    // scaleRatio = modifiedScale / originalScale = 1.0 / 0.5 = 2.0
    expect(transform.scaleX).toBe(2);
    expect(transform.scaleY).toBe(2);
    expect(transform.rotationDeg).toBe(0);

    // E = e / originalScale = 10 / 0.5 = 20
    // F = f / originalScale = 20 / 0.5 = 40
    // x = E + A * modified.width / 2 + C * modified.height / 2 = 20 + 2.0 * 400 = 820
    // y = F + B * modified.width / 2 + D * modified.height / 2 = 40 + 2.0 * 225 = 490
    expect(transform.x).toBe(820);
    expect(transform.y).toBe(490);
  });

  it("preserves non-exact content scale estimate from OpenCV matrix", () => {
    const original: ImageFileMeta = { ...baseMeta, width: 1600, height: 900 };
    const modified: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };

    // In work coordinates: a = 1.02 (with workScale ratio of 2.0, full scale is 2.04)
    // Dimension scale is 2.00, content scale is 2.04 (2% difference)
    const matrix = [1.02, 0, 0, 0, 1.02, 0];
    const originalScale = 0.5;
    const modifiedScale = 1.0;

    const transform = matToTransform(matrix, original, modified, originalScale, modifiedScale);

    expect(transform).not.toBeNull();
    if (!transform) return;

    // Should preserve 2.04 rather than snapping to dimensionScale (2.00)
    expect(transform.scaleX).toBeCloseTo(2.04, 5);
    expect(transform.scaleY).toBeCloseTo(2.04, 5);
  });

  it("returns null for invalid matrix or non-positive scales", () => {
    const original: ImageFileMeta = { ...baseMeta, width: 1600, height: 900 };
    const modified: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };

    expect(matToTransform([1, 0, 0], original, modified, 1, 1)).toBeNull();
    expect(matToTransform([1, 0, 0, 0, 1, 0], original, modified, 0, 1)).toBeNull();
    expect(matToTransform([1, 0, 0, 0, 1, 0], original, modified, 1, -0.5)).toBeNull();
  });
});
