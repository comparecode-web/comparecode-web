import { describe, expect, it } from "vitest";
import { buildDiffSurfaces, getHoveredBlockSurface, getLineSurface, getSelectedBlockSurface, type DiffSurfaceSpec } from "../diffSurfaces";

const items = (count: number, from = 0) => Array.from({ length: count }, (_, offset) => {
  const index = from + offset;
  return { index, start: index * 26.4, end: (index + 1) * 26.4 };
});

function spec(groupKey: string, className: string, roundedTop = false, roundedBottom = false): DiffSurfaceSpec {
  return { groupKey, className, roundedTop, roundedBottom };
}

describe("diff surfaces", () => {
  it("paints consecutive rows of one block and color as a single surface", () => {
    const specs = [
      spec("a:old", "bg-diff-removed-bg", true),
      spec("a:old", "bg-diff-removed-bg"),
      spec("a:old", "bg-diff-empty-bg"),
      spec("a:old", "bg-diff-empty-bg", false, true),
      null,
      spec("b:old", "bg-diff-removed-bg", true, true)
    ];
    const surfaces = buildDiffSurfaces(items(6), (index) => specs[index]);
    expect(surfaces).toEqual([
      { ...spec("a:old", "bg-diff-removed-bg", true, false), key: "a:old|bg-diff-removed-bg", top: 0, height: 52.8 },
      { ...spec("a:old", "bg-diff-empty-bg", false, true), key: "a:old|bg-diff-empty-bg", top: 52.8, height: 52.8 },
      { ...spec("b:old", "bg-diff-removed-bg", true, true), key: "b:old|bg-diff-removed-bg", top: 132, height: 26.4 }
    ].map((surface) => ({ ...surface, top: expect.closeTo(surface.top, 6), height: expect.closeTo(surface.height, 6) })));
  });

  it("keeps the corners square where a surface continues outside the rendered rows", () => {
    const specs = (index: number) => spec("a:new", "bg-diff-added-bg", index === 0, index === 99);
    const [surface] = buildDiffSurfaces(items(5, 40), specs);
    expect(surface).toMatchObject({ roundedTop: false, roundedBottom: false });
    expect(surface.top).toBeCloseTo(40 * 26.4, 6);
    expect(surface.height).toBeCloseTo(5 * 26.4, 6);
  });

  it("does not join rows across a gap in the rendered range", () => {
    const rows = [...items(2), ...items(2, 5)];
    expect(buildDiffSurfaces(rows, () => spec("a:old", "bg-diff-removed-bg"))).toHaveLength(2);
  });

  it("derives line, selection, and hover surfaces from block state", () => {
    const block = { id: "block", isSelected: false };
    const row = { type: "line" as const, block, isSelectable: true, isFirstLine: true, isLastLine: false };
    expect(getLineSurface(row, "old", "bg-transparent")).toBeNull();
    expect(getLineSurface(row, "old", "bg-diff-removed-bg")).toEqual(spec("block:old", "bg-diff-removed-bg", true, false));
    expect(getLineSurface({ ...row, type: "controls" }, "old", "bg-diff-removed-bg")).toBeNull();

    expect(getHoveredBlockSurface(row, "block")).toEqual(spec("block", "bg-hover-overlay", true, false));
    expect(getHoveredBlockSurface(row, "other")).toBeNull();
    expect(getSelectedBlockSurface(row, true)).toBeNull();

    const selected = { ...row, block: { ...block, isSelected: true } };
    expect(getHoveredBlockSurface(selected, "block")).toBeNull();
    expect(getSelectedBlockSurface(selected, true)).toEqual(spec("block", "bg-bg-primary", true, false));
    expect(getSelectedBlockSurface(selected, false)).toEqual(spec("block", "bg-bg-primary"));
    expect(getSelectedBlockSurface({ ...selected, isSelectable: false }, true)).toBeNull();
  });
});
