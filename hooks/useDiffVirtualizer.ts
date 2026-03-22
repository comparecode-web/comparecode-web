import { useVirtualizer } from "@tanstack/react-virtual";

export function useDiffVirtualizer<TScrollElement extends Element>(
  count: number,
  getScrollElement: () => TScrollElement | null,
  estimateSizeFn?: (index: number) => number
) {
  return useVirtualizer({
    count,
    getScrollElement,
    estimateSize: estimateSizeFn || (() => 24),
    overscan: 10
  });
}