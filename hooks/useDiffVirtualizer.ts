import { useVirtualizer } from "@tanstack/react-virtual";

export function useDiffVirtualizer<TScrollElement extends Element>(
  count: number,
  getScrollElement: () => TScrollElement | null
) {
  return useVirtualizer({
    count,
    getScrollElement,
    estimateSize: () => 24,
    overscan: 10
  });
}