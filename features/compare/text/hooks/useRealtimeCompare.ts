import { useEffect, useRef } from "react";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ComparisonResult } from "@/features/compare/text/types/diff";

export const LIVE_UPDATE_MIN_DELAY_MS = 150;
export const LIVE_UPDATE_MAX_DELAY_MS = 1000;
export const LIVE_UPDATE_SLOW_RUN_MS = 250;
export const LIVE_UPDATE_SIZE_LIMIT = 2_000_000;
const COMPOSITION_RETRY_MS = 200;

export function isComparisonStale(result: ComparisonResult | null, leftText: string, rightText: string): boolean {
  return !!result?.sourceTexts && (result.sourceTexts.original !== leftText || result.sourceTexts.modified !== rightText);
}

export function getLiveUpdateDelay(lastDurationMs: number): number {
  return Math.min(LIVE_UPDATE_MAX_DELAY_MS, Math.max(LIVE_UPDATE_MIN_DELAY_MS, Math.round(lastDurationMs * 2)));
}

export function useRealtimeCompare() {
  const leftText = useEditorStore((state) => state.leftText);
  const rightText = useEditorStore((state) => state.rightText);
  const comparisonResult = useEditorStore((state) => state.comparisonResult);
  const isEnabled = useSettingsStore((state) => state.settings.isRealtimeCompareEnabled);
  const isPaused = useEditorUIStore((state) => state.isLiveUpdatePaused);
  const lastDuration = useRef(0);
  const isComposing = useRef(false);

  useEffect(() => {
    const start = () => { isComposing.current = true; };
    const end = () => { isComposing.current = false; };
    document.addEventListener("compositionstart", start);
    document.addEventListener("compositionend", end);
    return () => {
      document.removeEventListener("compositionstart", start);
      document.removeEventListener("compositionend", end);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled || isPaused || !isComparisonStale(comparisonResult, leftText, rightText)) return;
    if (leftText.length + rightText.length > LIVE_UPDATE_SIZE_LIMIT) {
      useEditorUIStore.getState().setIsLiveUpdatePaused(true);
      return;
    }
    let timer = 0;
    const run = () => {
      if (isComposing.current) {
        timer = window.setTimeout(run, COMPOSITION_RETRY_MS);
        return;
      }
      const store = useEditorStore.getState();
      if (!isComparisonStale(store.comparisonResult, store.leftText, store.rightText)) return;
      const startedAt = performance.now();
      store.recompute(useSettingsStore.getState().settings);
      lastDuration.current = performance.now() - startedAt;
      if (lastDuration.current > LIVE_UPDATE_SLOW_RUN_MS) useEditorUIStore.getState().setIsLiveUpdatePaused(true);
    };
    timer = window.setTimeout(run, getLiveUpdateDelay(lastDuration.current));
    return () => window.clearTimeout(timer);
  }, [comparisonResult, leftText, rightText, isEnabled, isPaused]);
}
