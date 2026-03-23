"use client";

import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardArrowUp, MdTune, MdClose } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";
import { useEditorUIStore } from "@/store/useEditorUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { OptionsView } from "./OptionsView";
import { InputView } from "./InputView";
import { ComparisonView } from "@/components/diff/ComparisonView";
import { cn } from "@/utils/uiHelpers";

export function EditorView() {
  const { comparisonResult } = useEditorStore();
  const { isInputExpanded, toggleInputPanel, isOptionsPanelOpen, setIsOptionsPanelOpen } = useEditorUIStore();
  const { settings } = useSettingsStore();

  const hasResult = comparisonResult && comparisonResult.blocks.length > 0;

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary relative">
      <div
        className={cn(
          "flex flex-col bg-bg-secondary transition-[width] duration-[var(--duration-medium)] overflow-hidden h-full shrink-0 z-10",
          "max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-40 max-sm:h-full max-sm:shadow-lg max-sm:transition-transform max-sm:duration-[var(--duration-medium)]",
          isOptionsPanelOpen
            ? "w-64 border-r border-border-default max-sm:translate-x-0"
            : "w-0 border-r-0 max-sm:-translate-x-full"
        )}
      >
        <div className="flex w-64 flex-col h-full shrink-0">
          <div className="flex items-center justify-between border-b border-border-default px-4 h-[var(--header-height)] shrink-0 bg-bg-secondary">
            <div className="flex items-center gap-2">
              <MdTune className="text-xl text-text-secondary" />
              <h2 className="text-base font-bold text-text-primary">Options</h2>
            </div>
            <button
              onClick={() => setIsOptionsPanelOpen(false)}
              className="flex items-center justify-center rounded p-1 text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors duration-[var(--duration-short)]"
              title="Close Options"
            >
              <MdKeyboardArrowLeft className="text-2xl hidden sm:block" />
              <MdClose className="text-2xl sm:hidden" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <OptionsView />
          </div>
        </div>
      </div>

      {isOptionsPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 sm:hidden"
          onClick={() => setIsOptionsPanelOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative z-0">
        {!isOptionsPanelOpen && (
          <button
            onClick={() => setIsOptionsPanelOpen(true)}
            className="absolute left-0 top-6 z-30 flex h-12 w-6 items-center justify-center rounded-r-md bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-[var(--duration-short)]"
            title="Open Options"
          >
            <MdKeyboardArrowRight className="text-2xl" />
          </button>
        )}

        <div
          className={cn(
            "flex flex-col bg-bg-primary relative",
            hasResult || !isInputExpanded ? "flex-1 overflow-hidden" : "shrink-0 h-0"
          )}
        >
          <ComparisonView />
        </div>

        {!isInputExpanded && (
          <button
            onClick={toggleInputPanel}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex h-8 pl-3 pr-5 items-center justify-center gap-1 rounded-t-md bg-accent-primary text-white shadow-md hover:bg-accent-hover transition-colors duration-[var(--duration-short)] text-sm font-semibold"
            title="Show Input"
          >
            <MdKeyboardArrowUp className="text-xl" />
            <span className="hidden sm:inline">Input Editor</span>
            <span className="sm:hidden">Input</span>
          </button>
        )}

        <div
          className={cn(
            "flex flex-col shrink-0 transition-[height,opacity,min-height] duration-[var(--duration-medium)] ease-in-out overflow-hidden bg-bg-primary z-10",
            isInputExpanded
              ? (hasResult
                ? "max-sm:h-[calc(100dvh-var(--header-height))] sm:h-[var(--input-panel-height)] sm:min-h-[var(--input-panel-min-height)] border-t border-border-default shadow-sm opacity-100"
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