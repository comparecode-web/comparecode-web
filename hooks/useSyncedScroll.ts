import { useRef, useCallback } from "react";
import { UI_CONSTANTS } from "@/config/constants";

export function useSyncedScroll() {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<"left" | "right" | null>(null);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLeftScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current === "right") return;
    isSyncingScroll.current = "left";
    
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = e.currentTarget.scrollTop;
      rightScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }
    
    syncTimeout.current = setTimeout(() => {
      isSyncingScroll.current = null;
    }, UI_CONSTANTS.SCROLL_SYNC_TIMEOUT_MS);
  }, []);

  const handleRightScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current === "left") return;
    isSyncingScroll.current = "right";
    
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
      leftScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }
    
    syncTimeout.current = setTimeout(() => {
      isSyncingScroll.current = null;
    }, UI_CONSTANTS.SCROLL_SYNC_TIMEOUT_MS);
  }, []);

  return {
    leftScrollRef,
    rightScrollRef,
    handleLeftScroll,
    handleRightScroll
  };
}