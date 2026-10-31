import { ComparisonResult } from "@/features/compare/text/types/diff";
import { UI_CONSTANTS } from "@/config/constants";
import type { HiddenRange } from "@/features/compare/text/utils/unchangedRegions";

function getDiffScrollAreas(container: HTMLElement): Array<HTMLElement> {
  const explicitArea = container.querySelector<HTMLElement>("#diff-scroll-area");
  if (explicitArea) {
    return [explicitArea];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(".overflow-auto, .overflow-y-auto"));
}

function findTargetRow(scrollArea: HTMLElement, blockId: string): HTMLElement | null {
  const escapedId = CSS.escape(blockId);

  const headerRow = scrollArea.querySelector<HTMLElement>(`[data-block-id="${escapedId}"][data-row-type="header-controls"]`);
  if (headerRow) {
    return headerRow;
  }

  return scrollArea.querySelector<HTMLElement>(`[data-block-id="${escapedId}"][data-row-type="line"][data-first-line="true"]`);
}

function alignBlockTopInScrollArea(scrollArea: HTMLElement, blockId: string): boolean {
  const targetRow = findTargetRow(scrollArea, blockId);
  if (!targetRow) {
    return false;
  }

  const delta = targetRow.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top;
  scrollArea.scrollTop += delta;
  return true;
}

export function estimateScrollTop(comparisonResult: ComparisonResult, blockId: string, hiddenRanges?: ReadonlyMap<string, HiddenRange> | null): number {
  let rowsBefore = 0;
  let collapsedBefore = 0;

  for (let i = 0; i < comparisonResult.blocks.length; i++) {
    const block = comparisonResult.blocks[i];

    if (block.id === blockId) {
      break;
    }

    const hidden = hiddenRanges?.get(block.id);
    rowsBefore += Math.max(block.oldLines.length, block.newLines.length) - (hidden ? hidden.end - hidden.start : 0);
    if (hidden) collapsedBefore++;
  }

  return rowsBefore * UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT + collapsedBefore * UI_CONSTANTS.VIRTUAL_ROW_COLLAPSED_HEIGHT;
}

export function scrollToBlockInDOM(comparisonResult: ComparisonResult | null, blockId: string, hiddenRanges?: ReadonlyMap<string, HiddenRange> | null): void {
  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = getDiffScrollAreas(container);
    const alignNow = () => {
      let alignedAny = false;

      scrollAreas.forEach((scrollArea) => {
        if (alignBlockTopInScrollArea(scrollArea, blockId)) {
          alignedAny = true;
        }
      });

      return alignedAny;
    };

    if (alignNow()) {
      return;
    }

    if (!comparisonResult) {
      return;
    }

    const targetScrollTop = estimateScrollTop(comparisonResult, blockId, hiddenRanges);

    scrollAreas.forEach((scrollArea) => {
      scrollArea.scrollTop = targetScrollTop;
    });

    requestAnimationFrame(() => {
      if (alignNow()) {
        return;
      }

      requestAnimationFrame(() => {
        alignNow();
      });
    });
  }
}

export function scrollToTopInDOM(): void {
  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = getDiffScrollAreas(container);

    scrollAreas.forEach((scrollArea) => {
      scrollArea.scrollTop = 0;
    });
  }
}

export function scrollToBottomInDOM(): void {
  const container = document.getElementById("diff-container");

  if (container) {
    const scrollAreas = getDiffScrollAreas(container);

    scrollAreas.forEach((scrollArea) => {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    });
  }
}
