import { describe, expect, it } from "vitest";
import { registerImages } from "../registrationEngine";
import { createScene, transform, transformScene } from "./alignmentFixtures";
import { buildAffineMatrix, transformPoint } from "../transformUtils";

const options = { rotate: true, scale: true, warp: false };
const scene = createScene();

describe("image registration", () => {
  it("keeps an identical image exactly in place and is deterministic", () => {
    const result = registerImages(scene, scene, options);
    expect(result?.transform).toEqual(transform());
    expect(registerImages(scene, scene, options)).toEqual(result);
  });

  it.each([
    { name: "equal-size translation", width: 320, height: 240, expected: transform({ x: 132, y: 138 }) },
    { name: "a crop with the same aspect ratio", width: 240, height: 180, expected: transform({ x: 142, y: 110 }) },
    { name: "different resolutions", width: 160, height: 120, expected: transform({ scaleX: 2, scaleY: 2 }) },
    { name: "rotation beyond the former three-degree search", width: 320, height: 240, expected: transform({ rotationDeg: 23 }) },
    { name: "large rotation", width: 320, height: 320, expected: transform({ rotationDeg: -80 }) },
    { name: "combined translation, rotation and scale", width: 320, height: 240, expected: transform({ x: 174, y: 102, scaleX: 0.8, scaleY: 0.8, rotationDeg: -17 }) },
    { name: "real small content scale and rotation", width: 320, height: 240, expected: transform({ scaleX: 1.02, scaleY: 1.02, rotationDeg: 0.18 }) }
  ])("recovers $name from pixels", ({ width, height, expected }) => {
    const modified = transformScene(scene, width, height, expected);
    const result = registerImages(scene, modified, options);
    expect(result).not.toBeNull();
    expect(result!.transform.x).toBeCloseTo(expected.x, 0);
    expect(result!.transform.y).toBeCloseTo(expected.y, 0);
    expect(Math.abs(result!.transform.scaleX - expected.scaleX)).toBeLessThan(0.008);
    expect(Math.abs(result!.transform.rotationDeg - expected.rotationDeg)).toBeLessThan(0.3);
    expect(result!.matchCount).toBeGreaterThanOrEqual(6);
  });

  it.each([
    { rotate: false, scale: false, warp: false },
    { rotate: false, scale: true, warp: false },
    { rotate: true, scale: false, warp: false }
  ])("fits only the allowed transformations: %j", allowed => {
    const expected = transform({ x: 144, y: 129, scaleX: allowed.scale ? 1.2 : 1, scaleY: allowed.scale ? 1.2 : 1, rotationDeg: allowed.rotate ? 15 : 0 });
    const result = registerImages(scene, transformScene(scene, 320, 240, expected), allowed);
    expect(result).not.toBeNull();
    if (!allowed.rotate) expect(result!.transform.rotationDeg).toBe(0);
    if (!allowed.scale) expect(result!.transform.scaleX).toBeCloseTo(1, 12);
    expect(Math.abs(result!.transform.x - expected.x)).toBeLessThan(0.6);
    expect(Math.abs(result!.transform.y - expected.y)).toBeLessThan(0.6);
  });

  it("ignores localized edits instead of moving the unchanged background", () => {
    const modified = createScene();
    for (let y = 60; y < 140; y++) for (let x = 80; x < 160; x++) modified.data.set([255, 0, 0, 255], (y * modified.width + x) * 4);
    const result = registerImages(scene, modified, options);
    expect(result?.transform).toEqual(transform());
  });

  it("does not infer a match from unrelated, flat, transparent or invalid pixels", () => {
    expect(registerImages(scene, createScene(957), options)).toBeNull();
    expect(registerImages(scene, { ...scene, data: new Uint8ClampedArray(scene.data.length).fill(255) }, options)).toBeNull();
    const hidden = createScene();
    for (let i = 3; i < hidden.data.length; i += 4) hidden.data[i] = 0;
    expect(registerImages(scene, hidden, options)).toBeNull();
    expect(registerImages({ ...scene, width: 0 }, scene, options)).toBeNull();
    expect(registerImages({ ...scene, data: new Uint8ClampedArray(4) }, scene, options)).toBeNull();
    expect(registerImages(scene, scene, { ...options, warp: true })).toBeNull();
  });

  it("converts work-image coordinates back to original pixels", () => {
    const expected = transform({ x: 140, y: 130 });
    const modified = transformScene(scene, 320, 240, expected);
    const result = registerImages({ ...scene, sourceWidth: 1280, sourceHeight: 960 }, modified, options);
    expect(result?.transform.x).toBeCloseTo(expected.x * 4, 0);
    expect(result?.transform.y).toBeCloseTo(expected.y * 4, 0);
    expect(result?.transform.scaleX).toBeCloseTo(4, 2);
  });

  it("finds the inverse placement when the inputs are swapped", () => {
    const expected = transform({ x: 142, y: 130, scaleX: 0.9, scaleY: 0.9, rotationDeg: 18 });
    const modified = transformScene(scene, 300, 260, expected);
    const reverse = registerImages(modified, scene, options);
    expect(reverse).not.toBeNull();
    const forwardMatrix = buildAffineMatrix(expected, modified.width, modified.height);
    const reverseMatrix = buildAffineMatrix(reverse!.transform, scene.width, scene.height);
    for (const point of [{ x: 60, y: 60 }, { x: 220, y: 180 }]) {
      const target = transformPoint(forwardMatrix, point.x, point.y);
      const restored = transformPoint(reverseMatrix, target.x, target.y);
      expect(Math.hypot(restored.x - point.x, restored.y - point.y)).toBeLessThan(0.75);
    }
  });

  it("matches visible details across brightness changes and transparent padding", () => {
    const expected = transform({ x: 144, y: 109 });
    const modified = transformScene(scene, 320, 240, expected);
    for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
      const p = (y * 320 + x) * 4;
      if (x < 35 || y < 30) { modified.data[p + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) modified.data[p + c] = modified.data[p + c] * 0.75 + 25;
    }
    const result = registerImages(scene, modified, options);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.transform.x - expected.x)).toBeLessThan(0.6);
    expect(Math.abs(result!.transform.y - expected.y)).toBeLessThan(0.6);
  });
});
