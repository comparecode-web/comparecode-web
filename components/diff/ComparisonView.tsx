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
  const { comparisonResult, leftText, rightText, selectBlock, scrollToBlock } = useEditorStore();
  const { isInputExpanded } = useEditorUIStore();
  const { settings } = useSettingsStore();
  const { executeCompare } = useCompareActions();

  const storeRefs = useRef({ leftText, rightText, executeCompare, settings, selectBlock, scrollToBlock });

  useEffect(() => {
    storeRefs.current = { leftText, rightText, executeCompare, settings, selectBlock, scrollToBlock };
  });

  useEffect(() => {
    if (storeRefs.current.leftText || storeRefs.current.rightText) {
      storeRefs.current.executeCompare(storeRefs.current.settings, false, true);
    }
  }, [settings.precision]);

  useEffect(() => {
    storeRefs.current.selectBlock(null);
  }, [settings.ignoreWhitespace]);

  const handleSegmentClick = (blockId: string) => {
    selectBlock(blockId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBlock(blockId);
      });
    });
  };

  const hasResult = comparisonResult && comparisonResult.blocks.length > 0;
  const hideBody = !hasResult && isInputExpanded;

  return (
    <div className={cn("flex w-full min-h-0 flex-col bg-bg-primary relative", !hideBody && "h-full")}>
      {!hideBody && <ComparisonToolbar />}

      {!hideBody && (
        <div id="diff-container" className="flex flex-1 min-h-0 overflow-hidden relative" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
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
            <div className="absolute right-1 top-0 h-full z-30 pointer-events-none hidden sm:block">
              <div className="pointer-events-auto h-full py-2">
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