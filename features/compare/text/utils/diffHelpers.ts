import { BlockType, ChangeBlock, DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";

export function getBlockColorClass(kind: BlockType, side: "old" | "new", isWhitespaceChange: boolean, ignoreWhitespace: boolean): string {
  if (ignoreWhitespace && isWhitespaceChange) {
    return "bg-transparent";
  }

  if (kind === BlockType.Modified) {
    return side === "old" ? "bg-diff-removed-bg" : "bg-diff-added-bg";
  }

  if (kind === BlockType.Added) {
    return side === "new" ? "bg-diff-added-bg" : "bg-diff-empty-bg";
  }

  if (kind === BlockType.Removed) {
    return side === "old" ? "bg-diff-removed-bg" : "bg-diff-empty-bg";
  }

  return "bg-transparent";
}

export function getFragmentColorClass(kind: DiffChangeType, isWhitespaceChange: boolean, ignoreWhitespace: boolean): string {
  if (ignoreWhitespace && isWhitespaceChange) {
    return "bg-transparent text-text-primary";
  }

  if (kind === DiffChangeType.Inserted) {
    return "bg-diff-added-fg text-text-primary";
  }

  if (kind === DiffChangeType.Deleted) {
    return "bg-diff-removed-fg text-text-primary";
  }

  return "bg-transparent text-text-primary";
}

export function getFragmentRoundingClass(fragments: Array<TextFragment>, index: number, ignoreWhitespace: boolean): string {
  const current = fragments[index];

  if (current.kind === DiffChangeType.Unchanged || (ignoreWhitespace && current.isWhitespaceChange)) {
    return "";
  }

  let isLeftRounded = false;
  let isRightRounded = false;

  if (index === 0) {
    isLeftRounded = true;
  } else {
    const prev = fragments[index - 1];
    if (prev.kind === DiffChangeType.Unchanged || (ignoreWhitespace && prev.isWhitespaceChange)) {
      isLeftRounded = true;
    }
  }

  if (index === fragments.length - 1) {
    isRightRounded = true;
  } else {
    const next = fragments[index + 1];
    if (next.kind === DiffChangeType.Unchanged || (ignoreWhitespace && next.isWhitespaceChange)) {
      isRightRounded = true;
    }
  }

  if (isLeftRounded && isRightRounded) {
    return "rounded";
  }

  if (isLeftRounded) {
    return "rounded-l";
  }

  if (isRightRounded) {
    return "rounded-r";
  }

  return "";
}

export function calculateStats(blocks: Array<ChangeBlock> | undefined, ignoreWhitespace: boolean) {
  let removals = 0;
  let additions = 0;

  if (!blocks) {
    return { removals, additions };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (ignoreWhitespace && block.isWhitespaceChange) {
      continue;
    }

    if (block.kind === BlockType.Removed || block.kind === BlockType.Modified) {
      removals += block.oldLines.length;
    }

    if (block.kind === BlockType.Added || block.kind === BlockType.Modified) {
      additions += block.newLines.length;
    }
  }

  return { removals, additions };
}

export function calculateMinimapSegments(blocks: Array<ChangeBlock>, ignoreWhitespace: boolean) {
  let totalHeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    totalHeight += Math.max(blocks[i].oldLines.length, blocks[i].newLines.length);
  }

  if (totalHeight === 0) {
    totalHeight = 1;
  }

  let currentIndex = 0;
  const result = [ ];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const height = Math.max(block.oldLines.length, block.newLines.length);

    if (block.kind !== BlockType.Unchanged) {
      if (!(ignoreWhitespace && block.isWhitespaceChange)) {
        const offsetPct = (currentIndex / totalHeight) * 100;
        let heightPct = (height / totalHeight) * 100;

        if (heightPct < 0.5) {
          heightPct = 0.5;
        }

        result.push({
          id: block.id,
          offsetPct,
          heightPct,
          kind: block.kind,
          isSelected: block.isSelected || false
        });
      }
    }
    currentIndex += height;
  }

  return result;
}
