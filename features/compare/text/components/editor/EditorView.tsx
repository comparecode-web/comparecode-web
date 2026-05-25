"use client";

import { useEffect } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardArrowUp, MdKeyboardArrowDown, MdTune, MdBorderColor } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { OptionsView } from "./OptionsView";
import { MergeHistoryView } from "./MergeHistoryView";
import { InputView } from "./InputView";
import { ComparisonView } from "@/features/compare/text/components/diff/ComparisonView";
import { cn } from "@/utils/uiHelpers";
import { MdHistory } from "react-icons/md";
import { isEditableTarget } from "@/features/compare/text/utils/keyboard";

export function EditorView() {
  const { comparisonResult } = useEditorStore();
  const { isInputExpanded, toggleInputPanel, isOptionsPanelOpen, setIsOptionsPanelOpen, optionsPanelTab, setOptionsPanelTab } = useEditorUIStore();
  const hasResult = comparisonResult && comparisonResult.blocks.length > 0;
  const isInputEditorToggleDisabled = !hasResult && isInputExpanded;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key !== "e" && key !== "o") {
        return;
      }

      if (event.repeat) {
        return;
      }

      if (key === "e" && isInputEditorToggleDisabled) {
        return;
      }

      event.preventDefault();

      if (key === "o") {
        const uiState = useEditorUIStore.getState();
        uiState.setIsOptionsPanelOpen(!uiState.isOptionsPanelOpen);
        return;
      }

      toggleInputPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isInputEditorToggleDisabled, toggleInputPanel]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-bg-primary relative">
      <div
        className={cn(
          "flex flex-col bg-bg-secondary transition-[width] duration-(--duration-medium) overflow-hidden h-full shrink-0 z-10",
          "max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-40 max-sm:h-full max-sm:shadow-lg max-sm:transition-transform max-sm:duration-(--duration-medium)",
          isOptionsPanelOpen
            ? "w-64 border-r border-border-default max-sm:translate-x-0"
            : "w-0 border-r-0 max-sm:-translate-x-full"
        )}
      >
        <div className="flex w-64 flex-col h-full shrink-0">
          <div className="flex items-center justify-between border-b border-border-default px-4 h-(--header-height) shrink-0 bg-bg-secondary">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOptionsPanelTab("options")}
                className={cn(
                  "flex items-center justify-center rounded p-2 transition-colors duration-(--duration-short)",
                  optionsPanelTab === "options"
                    ? "bg-hover-overlay text-accent-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title="Options"
              >
                <MdTune className="text-xl" />
              </button>
              <button
                onClick={() => setOptionsPanelTab("history")}
                className={cn(
                  "flex items-center justify-center rounded p-2 transition-colors duration-(--duration-short)",
                  optionsPanelTab === "history"
                    ? "bg-hover-overlay text-accent-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title="Merge History"
              >
                <MdHistory className="text-xl" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {optionsPanelTab === "options" ? <OptionsView /> : <MergeHistoryView />}
          </div>
        </div>
      </div>

      {isOptionsPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 sm:hidden"
          onClick={() => setIsOptionsPanelOpen(false)}
        />
      )}

      <div className="fixed bottom-3 right-2 z-40 flex flex-col gap-2 rounded-lg border border-border-default bg-bg-secondary/95 p-1 shadow-lg backdrop-blur-sm sm:hidden">
        <button
          onClick={() => setIsOptionsPanelOpen(!isOptionsPanelOpen)}
          className="grid h-8 w-11 grid-cols-2 place-items-center rounded-md bg-accent-primary px-0.5 text-white shadow-sm transition-colors duration-(--duration-short) hover:bg-accent-hover"
          title={isOptionsPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="text-xl shrink-0" />
          {isOptionsPanelOpen ? <MdKeyboardArrowLeft className="text-2xl shrink-0" /> : <MdKeyboardArrowRight className="text-2xl shrink-0" />}
        </button>
      </div>

      <div className="z-20 hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-border-default bg-bg-secondary px-1 py-2 sm:flex">
        <button
          onClick={() => setIsOptionsPanelOpen(!isOptionsPanelOpen)}
          className="grid h-8 w-full grid-cols-2 place-items-center rounded-md bg-accent-primary px-0.5 text-white shadow-sm transition-colors duration-(--duration-short) hover:bg-accent-hover"
          title={isOptionsPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="text-xl shrink-0" />
          {isOptionsPanelOpen ? <MdKeyboardArrowLeft className="text-2xl shrink-0" /> : <MdKeyboardArrowRight className="text-2xl shrink-0" />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden relative z-0">
        <div
          className={cn(
            "flex flex-col bg-bg-primary relative",
            hasResult || !isInputExpanded ? "flex-1 overflow-hidden" : "shrink-0 h-0"
          )}
        >
          <ComparisonView />
        </div>

        <div className="shrink-0 border-t border-border-default bg-bg-secondary px-2 py-1.5 sm:px-3 sm:py-2">
          <div className="flex items-center justify-center">
            <button
              onClick={toggleInputPanel}
              disabled={isInputEditorToggleDisabled}
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-accent-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors duration-(--duration-short)",
                isInputEditorToggleDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-accent-hover"
              )}
              title={isInputExpanded ? "Hide Input Editor" : "Show Input Editor"}
            >
              <MdBorderColor className="text-base shrink-0" />
              <span>Input Editor (E)</span>
              {isInputExpanded ? <MdKeyboardArrowDown className="text-xl shrink-0" /> : <MdKeyboardArrowUp className="text-xl shrink-0" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col shrink-0 transition-[height,opacity,min-height] duration-(--duration-medium) ease-in-out overflow-hidden bg-bg-primary z-10",
            isInputExpanded
              ? (hasResult
                ? "max-sm:h-[calc(100dvh-var(--header-height))] sm:h-(--input-panel-height) sm:min-h-(--input-panel-min-height) border-t border-border-default shadow-sm opacity-100"
                : "flex-1 opacity-100")
              : "h-0 min-h-0 opacity-0"
          )}
        >
          <InputView />
        </div>
      </div>
    </div>
  );
}


