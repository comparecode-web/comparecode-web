import { useVirtualizer } from "@tanstack/react-virtual";
import { UI_CONSTANTS } from "@/config/constants";

export function useDiffVirtualizer<TScrollElement extends Element>(
  count: number,
  getScrollElement: () => TScrollElement | null,
  estimateSizeFn?: (index: number) => number,
  getItemKeyFn?: (index: number) => string
) {
  return useVirtualizer({
    count,
    getScrollElement,
    estimateSize: estimateSizeFn || (() => UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT),
    getItemKey: getItemKeyFn,
    overscan: 10
  });
}