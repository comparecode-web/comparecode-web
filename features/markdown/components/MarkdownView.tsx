"use client";

import { useEffect, useRef } from "react";
import { MdHistory, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdTune } from "react-icons/md";
import { MarkdownHistoryView } from "./MarkdownHistoryView";
import { MarkdownOptionsView } from "./MarkdownOptionsView";
import { MarkdownSplitView } from "./MarkdownSplitView";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { useMarkdownFormattingActions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { cn } from "@/utils/uiHelpers";

export function MarkdownView() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markdownText = useMarkdownStore((state) => state.markdownText);
  const setMarkdownText = useMarkdownStore((state) => state.setMarkdownText);
  const undoMarkdownText = useMarkdownStore((state) => state.undoMarkdownText);
  const redoMarkdownText = useMarkdownStore((state) => state.redoMarkdownText);
  const canUndo = useMarkdownStore((state) => state.canUndo);
  const canRedo = useMarkdownStore((state) => state.canRedo);
  const loadPersistedMarkdownText = useMarkdownStore((state) => state.loadPersistedMarkdownText);
  const isMarkdownLoaded = useMarkdownStore((state) => state.isLoaded);
  const isOptionsPanelOpen = useMarkdownUIStore((state) => state.isOptionsPanelOpen);
  const setIsOptionsPanelOpen = useMarkdownUIStore((state) => state.setIsOptionsPanelOpen);
  const optionsPanelTab = useMarkdownUIStore((state) => state.optionsPanelTab);
  const setOptionsPanelTab = useMarkdownUIStore((state) => state.setOptionsPanelTab);
  const loadPersistedMarkdownUIState = useMarkdownUIStore((state) => state.loadPersistedMarkdownUIState);

  const { applyFormat } = useMarkdownFormattingActions({
    textareaRef,
    onChange: setMarkdownText
  });

  useEffect(() => {
    loadPersistedMarkdownText();
    loadPersistedMarkdownUIState();
  }, [loadPersistedMarkdownText, loadPersistedMarkdownUIState]);

  useEffect(() => {
    if (!isMarkdownLoaded) {
      return;
    }

    scheduleMarkdownContentSave(markdownText);
  }, [isMarkdownLoaded, markdownText]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full overflow-hidden bg-bg-primary">
      <div
        className={cn(
          "z-10 h-full shrink-0 overflow-hidden bg-bg-secondary transition-[width] duration-(--duration-medium)",
          "max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-40 max-sm:h-full max-sm:shadow-lg max-sm:transition-transform",
          isOptionsPanelOpen
            ? "w-64 border-r border-border-default max-sm:translate-x-0"
            : "w-0 border-r-0 max-sm:-translate-x-full"
        )}
      >
        <div className="flex h-full w-64 shrink-0 flex-col">
          <div className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-secondary px-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOptionsPanelTab("options")}
                className={cn(
                  "flex items-center justify-center rounded p-2 transition-colors",
                  optionsPanelTab === "options"
                    ? "bg-hover-overlay text-accent-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title="Options"
              >
                <MdTune className="text-xl" />
              </button>
              <button
                type="button"
                onClick={() => setOptionsPanelTab("history")}
                className={cn(
                  "flex items-center justify-center rounded p-2 transition-colors",
                  optionsPanelTab === "history"
                    ? "bg-hover-overlay text-accent-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title="Markdown History"
              >
                <MdHistory className="text-xl" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {optionsPanelTab === "options" ? <MarkdownOptionsView /> : <MarkdownHistoryView />}
          </div>
        </div>
      </div>

      {isOptionsPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          onClick={() => setIsOptionsPanelOpen(false)}
        />
      )}

      <div className="fixed bottom-3 right-2 z-40 flex flex-col gap-2 rounded-lg border border-border-default bg-bg-secondary/95 p-1 shadow-lg backdrop-blur-sm sm:hidden">
        <button
          type="button"
          onClick={() => setIsOptionsPanelOpen(!isOptionsPanelOpen)}
          className="grid h-8 w-11 grid-cols-2 place-items-center rounded-md bg-accent-primary px-0.5 text-white shadow-sm transition-colors hover:bg-accent-hover"
          title={isOptionsPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="shrink-0 text-xl" />
          {isOptionsPanelOpen ? <MdKeyboardArrowLeft className="shrink-0 text-2xl" /> : <MdKeyboardArrowRight className="shrink-0 text-2xl" />}
        </button>
      </div>

      <div className="z-20 hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-border-default bg-bg-secondary px-1 py-2 sm:flex">
        <button
          type="button"
          onClick={() => setIsOptionsPanelOpen(!isOptionsPanelOpen)}
          className="grid h-8 w-full grid-cols-2 place-items-center rounded-md bg-accent-primary px-0.5 text-white shadow-sm transition-colors hover:bg-accent-hover"
          title={isOptionsPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="shrink-0 text-xl" />
          {isOptionsPanelOpen ? <MdKeyboardArrowLeft className="shrink-0 text-2xl" /> : <MdKeyboardArrowRight className="shrink-0 text-2xl" />}
        </button>
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MarkdownToolbar
          onFormat={applyFormat}
          onUndo={undoMarkdownText}
          onRedo={redoMarkdownText}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <MarkdownSplitView
          value={markdownText}
          onChange={setMarkdownText}
          textareaRef={textareaRef}
          onUndo={undoMarkdownText}
          onRedo={redoMarkdownText}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
    </div>
  );
}
