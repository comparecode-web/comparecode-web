"use client";

import { useEffect, useRef } from "react";
import { MdKeyboardDoubleArrowDown, MdKeyboardDoubleArrowUp } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { ViewMode } from "@/types/settings";
import { ComparisonToolbar } from "./ComparisonToolbar";
import { SplitView } from "./SplitView";
import { UnifiedView } from "./UnifiedView";
import { DiffMinimap } from "./DiffMinimap";
import { cn } from "@/utils/uiHelpers";

export function ComparisonView() {
  const { comparisonResult, leftText, rightText, selectBlock, scrollToBlock, scrollToTop, scrollToBottom } = useEditorStore();
  const { isInputExpanded } = useEditorUIStore();
  const { settings } = useSettingsStore();
  const { executeCompare } = useTextCompareActions();

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

          {hasResult && settings.isJumpButtonsVisible && (
            <div className="absolute bottom-4 right-4 sm:right-16 z-30 flex flex-col items-center gap-2">
              <button
                onClick={scrollToTop}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-(--duration-short)"
                title="Jump to top"
              >
                <MdKeyboardDoubleArrowUp className="text-2xl" />
              </button>
              <button
                onClick={scrollToBottom}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-(--duration-short)"
                title="Jump to bottom"
              >
                <MdKeyboardDoubleArrowDown className="text-2xl" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


