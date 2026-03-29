import { useLiveTimeTicker as useSharedLiveTimeTicker } from "@/hooks/useLiveTimeTicker";

export function useLiveTimeTicker(timestamps: Array<string>): number {
  return useSharedLiveTimeTicker(timestamps);
}

