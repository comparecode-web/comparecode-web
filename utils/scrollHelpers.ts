import { ComparisonResult } from "@/types/diff";

export function scrollToBlockInDOM(comparisonResult: ComparisonResult | null, blockId: string): void {
  if (!comparisonResult) {
    return;
  }

  let totalHeight = 0;

  for (let i = 0; i < comparisonResult.blocks.length; i++) {
    totalHeight += Math.max(comparisonResult.blocks[i].oldLines.length, comparisonResult.blocks[i].newLines.length);
  }

  if (totalHeight === 0) {
    totalHeight = 1;
  }

  let currentIndex = 0;
  let targetOffsetPct = 0;

  for (let i = 0; i < comparisonResult.blocks.length; i++) {
    const block = comparisonResult.blocks[i];
    const height = Math.max(block.oldLines.length, block.newLines.length);

    if (block.id === blockId) {
      targetOffsetPct = (currentIndex / totalHeight) * 100;
      break;
    }

    currentIndex += height;
  }

  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = container.querySelectorAll<HTMLElement>(".overflow-auto, .overflow-y-auto");

    scrollAreas.forEach((scrollArea) => {
      const topOffset = scrollArea.clientHeight * 0.1;
      let targetScroll = (targetOffsetPct / 100) * scrollArea.scrollHeight - topOffset;

      if (targetScroll < 0) {
        targetScroll = 0;
      }

      scrollArea.scrollTop = targetScroll;
    });
  }
}

export function scrollToTopInDOM(): void {
  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = container.querySelectorAll<HTMLElement>(".overflow-auto, .overflow-y-auto");

    scrollAreas.forEach((scrollArea) => {
      scrollArea.scrollTop = 0;
    });
  }
}

export function scrollToBottomInDOM(): void {
  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = container.querySelectorAll<HTMLElement>(".overflow-auto, .overflow-y-auto");

    scrollAreas.forEach((scrollArea) => {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    });
  }
}