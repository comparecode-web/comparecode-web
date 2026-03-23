import { useVirtualizer } from "@tanstack/react-virtual";
import { UI_CONSTANTS } from "@/config/constants";

export function useDiffVirtualizer<TScrollElement extends Element>(
  count: number,
  getScrollElement: () => TScrollElement | null,
  estimateSizeFn?: (index: number) => number
) {
  return useVirtualizer({
    count,
    getScrollElement,
    estimateSize: estimateSizeFn || (() => UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT),
    overscan: 10
  });
}