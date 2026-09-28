import { BlockType, ChangeBlock, DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";

export function getBlockColorClass(kind: BlockType, side: "old" | "new"): string {
  if (kind === BlockType.Modified) return side === "old" ? "bg-diff-removed-bg" : "bg-diff-added-bg";
  if (kind === BlockType.Added) return side === "new" ? "bg-diff-added-bg" : "bg-diff-empty-bg";
  if (kind === BlockType.Removed) return side === "old" ? "bg-diff-removed-bg" : "bg-diff-empty-bg";
  return "bg-transparent";
}

export function getFragmentColorClass(kind: DiffChangeType): string {
  if (kind === DiffChangeType.Inserted) return "bg-diff-added-fg text-text-primary";
  if (kind === DiffChangeType.Deleted) return "bg-diff-removed-fg text-text-primary";
  return "bg-transparent text-text-primary";
}

export function getFragmentRoundingClass(fragments: TextFragment[], index: number): string {
  const current = fragments[index];
  if (current.kind === DiffChangeType.Unchanged) return "";
  const left = index === 0 || fragments[index - 1].kind === DiffChangeType.Unchanged;
  const right = index === fragments.length - 1 || fragments[index + 1].kind === DiffChangeType.Unchanged;
  return left && right ? "rounded" : left ? "rounded-l" : right ? "rounded-r" : "";
}

export function calculateStats(blocks: ChangeBlock[] | undefined) {
  let removals = 0, additions = 0;
  for (const block of blocks ?? []) {
    removals += block.removalCount;
    additions += block.additionCount;
  }
  return { removals, additions };
}

export function calculateMinimapSegments(blocks: ChangeBlock[]) {
  const totalHeight = Math.max(1, blocks.reduce((total, block) => total + Math.max(block.oldLines.length, block.newLines.length), 0));
  let currentIndex = 0;
  const segments = [];
  for (const block of blocks) {
    const height = Math.max(block.oldLines.length, block.newLines.length);
    if (block.kind !== BlockType.Unchanged) {
      segments.push({ id: block.id, offsetPct: currentIndex / totalHeight * 100,
        heightPct: Math.max(0.5, height / totalHeight * 100), kind: block.kind, isSelected: block.isSelected || false });
    }
    currentIndex += height;
  }
  return segments;
}
