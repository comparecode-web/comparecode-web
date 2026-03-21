"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useEditorUIStore } from "@/store/useEditorUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCompareActions } from "@/hooks/useCompareActions";
import { ViewMode } from "@/types/settings";
import { ComparisonToolbar } from "./ComparisonToolbar";
import { SplitView } from "./SplitView";
import { UnifiedView } from "./UnifiedView";
import { DiffMinimap } from "./DiffMinimap";
import { cn } from "@/utils/uiHelpers";

export function ComparisonView() {
  const { comparisonResult, leftText, rightText, selectBlock } = useEditorStore();
  const { isInputExpanded } = useEditorUIStore();
  const { settings } = useSettingsStore();
  const { executeCompare } = useCompareActions();

  const storeRefs = useRef({ leftText, rightText, executeCompare, settings, selectBlock });

  useEffect(() => {
    storeRefs.current = { leftText, rightText, executeCompare, settings, selectBlock };
  });

  useEffect(() => {
    if (storeRefs.current.leftText || storeRefs.current.rightText) {
      storeRefs.current.executeCompare(storeRefs.current.settings, false, true);
    }
  }, [settings.precision]);

  useEffect(() => {
    storeRefs.current.selectBlock(null);
  }, [settings.ignoreWhitespace]);

  const handleSegmentClick = (blockId: string, offsetPct: number) => {
    selectBlock(blockId);

    const container = document.getElementById("diff-container");
    if (container) {
      const scrollAreas = container.querySelectorAll<HTMLElement>(".overflow-auto, .overflow-y-auto");
      scrollAreas.forEach((scrollArea) => {
        const topOffset = scrollArea.clientHeight * 0.1;
        let targetScroll = (offsetPct / 100) * scrollArea.scrollHeight - topOffset;
        
        if (targetScroll < 0) {
          targetScroll = 0;
        }
        
        scrollArea.scrollTop = targetScroll;
      });
    }
  };

  const hasResult = comparisonResult && comparisonResult.blocks.length > 0;
  const hideBody = !hasResult && isInputExpanded;

  return (
    <div className={cn("flex w-full flex-col bg-bg-primary relative", !hideBody && "h-full")}>
      <ComparisonToolbar />

      {!hideBody && (
        <div id="diff-container" className="flex flex-1 overflow-hidden relative" style={{ fontSize: `${settings.fontSize}px` }}>
          {!hasResult ? (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-text-secondary">No comparison generated yet.</p>
            </div>
          ) : settings.viewMode === ViewMode.Split ? (
            <SplitView />
          ) : (
            <UnifiedView />
          )}

          {hasResult && (
            <div className="absolute right-2 top-0 h-full z-30 pointer-events-none">
              <div className="pointer-events-auto h-full">
                <DiffMinimap
                  blocks={comparisonResult.blocks}
                  ignoreWhitespace={settings.ignoreWhitespace}
                  onSegmentClick={handleSegmentClick}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}