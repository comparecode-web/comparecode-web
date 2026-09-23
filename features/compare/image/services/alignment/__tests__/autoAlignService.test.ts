import { describe, expect, it } from "vitest";
import { regularizeNearIdentityScale } from "../autoAlignService";
import type { ImageFileMeta } from "../../../store/useImageCompareStore";
import type { ImageAffineTransform } from "../types";

const baseMeta: ImageFileMeta = {
  name: "test.png",
  size: 1024,
  type: "image/png",
  lastModified: 1000,
  width: 800,
  height: 450,
  url: "blob:test",
  exif: null
};

describe("autoAlignService regularizeNearIdentityScale", () => {
  it("preserves non-exact estimated content scale instead of snapping to dimension ratio", () => {
    // Original 800x450 vs modified 400x225 -> dimension ratio is 2.00
    const original: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };
    const modified: ImageFileMeta = { ...baseMeta, width: 400, height: 225 };

    // Content scale estimated at 2.04 (e.g. 2% content difference)
    const transform: ImageAffineTransform = {
      x: 0,
      y: 0,
      scaleX: 2.04,
      scaleY: 2.04,
      rotationDeg: 0,
      flipX: false,
      flipY: false
    };

    const regularized = regularizeNearIdentityScale(original, modified, transform);

    // Should retain the non-exact content scale estimate
    expect(regularized.scaleX).toBe(2.04);
    expect(regularized.scaleY).toBe(2.04);
  });

  it("regularizes scale only when within subpixel epsilon of expected dimension ratio", () => {
    const original: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };
    const modified: ImageFileMeta = { ...baseMeta, width: 400, height: 225 };

    // Scale is 2.0005 (within 0.05% of 2.00)
    const transform: ImageAffineTransform = {
      x: 0,
      y: 0,
      scaleX: 2.0005,
      scaleY: 2.0005,
      rotationDeg: 0,
      flipX: false,
      flipY: false
    };

    const regularized = regularizeNearIdentityScale(original, modified, transform);
    expect(regularized.scaleX).toBe(2);
    expect(regularized.scaleY).toBe(2);
  });

  it("regularizes near-zero rotation jitter to exactly 0", () => {
    const original: ImageFileMeta = { ...baseMeta, width: 800, height: 450 };
    const modified: ImageFileMeta = { ...baseMeta, width: 400, height: 225 };

    const transform: ImageAffineTransform = {
      x: 0,
      y: 0,
      scaleX: 2.04,
      scaleY: 2.04,
      rotationDeg: 0.15, // < 0.25 deg jitter
      flipX: false,
      flipY: false
    };

    const regularized = regularizeNearIdentityScale(original, modified, transform);
    expect(regularized.rotationDeg).toBe(0);
    expect(regularized.scaleX).toBe(2.04);
  });
});
