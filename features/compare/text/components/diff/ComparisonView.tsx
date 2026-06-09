"use client";

import { useEffect, useRef } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdKeyboardDoubleArrowDown, MdKeyboardDoubleArrowUp } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { ViewMode } from "@/types/settings";
import { MergeDirection } from "@/types/ui";
import { ComparisonToolbar } from "./ComparisonToolbar";
import { SplitView } from "./SplitView";
import { UnifiedView } from "./UnifiedView";
import { DiffMinimap } from "./DiffMinimap";
import { cn } from "@/utils/uiHelpers";
import { useToastStore } from "@/store/useToastStore";
import type { PushToastParams } from "@/store/useToastStore";
import { isEditableTarget } from "@/features/compare/text/utils/keyboard";

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

export function ComparisonView() {
  const {
    comparisonResult,
    leftText,
    rightText,
    selectBlock,
    scrollToBlock,
    scrollToTop,
    scrollToBottom,
    jumpToNextBlock,
    jumpToPreviousBlock,
    mergeBlock,
    undoMergeStep,
    redoMergeStep
  } = useEditorStore();
  const { isInputExpanded } = useEditorUIStore();
  const { settings } = useSettingsStore();
  const { executeCompare } = useTextCompareActions();
  const pushToast = useToastStore((state): ((toast: PushToastParams) => void) => state.pushToast);

  const storeRefs = useRef({
    leftText,
    rightText,
    executeCompare,
    settings,
    selectBlock,
    scrollToBlock,
    comparisonResult,
    jumpToNextBlock,
    jumpToPreviousBlock,
    mergeBlock,
    undoMergeStep,
    redoMergeStep,
    pushToast
  });
  const historyShortcutInFlight = useRef(false);

  useEffect(() => {
    storeRefs.current = {
      leftText,
      rightText,
      executeCompare,
      settings,
      selectBlock,
      scrollToBlock,
      comparisonResult,
      jumpToNextBlock,
      jumpToPreviousBlock,
      mergeBlock,
      undoMergeStep,
      redoMergeStep,
      pushToast
    };
  });

  useEffect(() => {
    if (storeRefs.current.leftText || storeRefs.current.rightText) {
      storeRefs.current.executeCompare(storeRefs.current.settings, false, true);
    }
  }, [settings.precision]);

  useEffect(() => {
    storeRefs.current.selectBlock(null);
  }, [settings.ignoreWhitespace]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const refs = storeRefs.current;
      const editableTarget = isEditableTarget(event.target);
      const key = event.key;
      const isModifierPressed = isMacPlatform() ? event.metaKey : event.ctrlKey;
      const isUndoShortcut = !event.altKey
        && !event.shiftKey
        && isModifierPressed
        && (key === "z" || key === "Z");
      const isRedoShortcut = !event.altKey
        && isModifierPressed
        && ((key === "y" || key === "Y") || (event.shiftKey && (key === "z" || key === "Z")));

      if (isUndoShortcut || isRedoShortcut) {
        if (editableTarget) {
          return;
        }

        event.preventDefault();
        if (historyShortcutInFlight.current) {
          return;
        }

        historyShortcutInFlight.current = true;
        const shouldUndo = isUndoShortcut;

        void (async () => {
          try {
            const result = shouldUndo
              ? await refs.undoMergeStep(refs.settings)
              : await refs.redoMergeStep(refs.settings);

            if (result === "applied") {
              refs.pushToast({
                message: shouldUndo ? "Undo applied" : "Redo applied",
                tone: "success",
                icon: shouldUndo ? "undo" : "redo"
              });
              return;
            }

            refs.pushToast({
              message: shouldUndo ? "Nothing to undo" : "Nothing to redo",
              tone: "info",
              icon: shouldUndo ? "undo" : "redo",
              dedupeKey: shouldUndo ? "nothing-to-undo" : "nothing-to-redo"
            });
          } finally {
            historyShortcutInFlight.current = false;
          }
        })();

        return;
      }

      if (editableTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const result = refs.comparisonResult;
      if (!result || result.blocks.length === 0) {
        return;
      }

      if (key === "ArrowUp") {
        event.preventDefault();
        refs.jumpToPreviousBlock();
        return;
      }

      if (key === "ArrowDown") {
        event.preventDefault();
        refs.jumpToNextBlock();
        return;
      }

      const selectedBlock = result.blocks.find((block) => block.isSelected);
      if (!selectedBlock) {
        if (key === "Escape") {
          event.preventDefault();
        }
        return;
      }

      if (key === "Escape") {
        event.preventDefault();
        refs.selectBlock(null);
        return;
      }

      if (key === "ArrowRight") {
        event.preventDefault();
        refs.mergeBlock(selectedBlock, MergeDirection.LeftToRight, refs.settings);
        return;
      }

      if (key === "ArrowLeft") {
        event.preventDefault();
        refs.mergeBlock(selectedBlock, MergeDirection.RightToLeft, refs.settings);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

          {hasResult && settings.isMergeJumpButtonsVisible && (
            <div className="absolute top-4 right-4 sm:right-16 z-30 flex flex-col items-center gap-2">
              <button
                onClick={jumpToPreviousBlock}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-(--duration-short)"
                title="Jump to previous difference"
              >
                <MdKeyboardArrowUp className="text-2xl" />
              </button>
              <button
                onClick={jumpToNextBlock}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-(--duration-short)"
                title="Jump to next difference"
              >
                <MdKeyboardArrowDown className="text-2xl" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


