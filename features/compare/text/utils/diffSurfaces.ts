export interface DiffSurfaceSpec {
  groupKey: string;
  className: string;
  roundedTop: boolean;
  roundedBottom: boolean;
}

export interface DiffSurface extends DiffSurfaceSpec {
  key: string;
  top: number;
  height: number;
}

interface SurfaceRow {
  type: "line" | "controls" | "header-controls";
  block: { id: string; isSelected?: boolean };
  isSelectable: boolean;
  isFirstLine?: boolean;
  isLastLine?: boolean;
}

function lineSurface(row: SurfaceRow, groupKey: string, className: string, isRounded: boolean): DiffSurfaceSpec {
  return { groupKey, className, roundedTop: isRounded && !!row.isFirstLine, roundedBottom: isRounded && !!row.isLastLine };
}

export function getSelectedBlockSurface(row: SurfaceRow | undefined, isRounded: boolean): DiffSurfaceSpec | null {
  if (row?.type !== "line" || !row.isSelectable || !row.block.isSelected) return null;
  return lineSurface(row, row.block.id, "bg-bg-primary", isRounded);
}

export function getHoveredBlockSurface(row: SurfaceRow | undefined, hoveredBlockId: string | null): DiffSurfaceSpec | null {
  if (row?.type !== "line" || !row.isSelectable || row.block.isSelected || row.block.id !== hoveredBlockId) return null;
  return lineSurface(row, row.block.id, "bg-hover-overlay", true);
}

export function getLineSurface(row: SurfaceRow | undefined, side: string, className: string): DiffSurfaceSpec | null {
  if (row?.type !== "line" || className === "bg-transparent") return null;
  return lineSurface(row, `${row.block.id}:${side}`, className, true);
}

interface PositionedRow {
  index: number;
  start: number;
  end: number;
}

export function buildDiffSurfaces(items: ReadonlyArray<PositionedRow>, getSpec: (index: number) => DiffSurfaceSpec | null): Array<DiffSurface> {
  const surfaces: Array<DiffSurface> = [];
  let current: DiffSurface | null = null;
  let previousIndex = Number.NaN;
  const keys = new Set<string>();

  for (const item of items) {
    const spec = getSpec(item.index);
    const continues = spec !== null && current !== null && item.index === previousIndex + 1
      && current.groupKey === spec.groupKey && current.className === spec.className;
    if (continues) {
      current!.height = item.end - current!.top;
      current!.roundedBottom = spec.roundedBottom;
    } else if (spec) {
      const key = `${spec.groupKey}|${spec.className}`;
      current = { ...spec, key: keys.has(key) ? `${key}|${item.index}` : key, top: item.start, height: item.end - item.start };
      keys.add(current.key);
      surfaces.push(current);
    } else {
      current = null;
    }
    previousIndex = item.index;
  }
  return surfaces;
}
