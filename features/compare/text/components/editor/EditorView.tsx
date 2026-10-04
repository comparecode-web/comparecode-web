"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdTune, MdBorderColor, MdHistory, MdCode } from "react-icons/md";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { Button } from "@/components/ui/Button";
import { useOptionsPanelShortcut } from "@/components/layout/useOptionsPanelShortcut";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { OptionsView, TextTestButton } from "./OptionsView";
import { CompactTextOptions } from "./CompactTextOptions";
import { MergeHistoryView } from "./MergeHistoryView";
import { InputView } from "./InputView";
import { ComparisonView } from "@/features/compare/text/components/diff/ComparisonView";
import { cn } from "@/utils/uiHelpers";
import { isEditableTarget } from "@/features/compare/text/utils/keyboard";
import { isWorkspaceShortcutBlocked } from "@/utils/workspaceKeyboard";
import { readTextCompareFile, TextImportError, TEXT_IMPORT_ACCEPT } from "@/features/compare/text/services/textFileImport";
import { useToastStore } from "@/store/useToastStore";

export function EditorView() {
  const { comparisonResult, leftText, rightText, importText } = useEditorStore();
  const pushToast = useToastStore((state) => state.pushToast);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);
  const importGeneration = useRef({ left: 0, right: 0 });
  const [dropSide, setDropSide] = useState<"left" | "right">("left");
  useEffect(() => () => {
    importGeneration.current.left += 1;
    importGeneration.current.right += 1;
  }, []);
  const handleImportFiles = useCallback(async (side: "left" | "right", files: FileList) => {
    const generation = ++importGeneration.current[side];
    if (files.length !== 1) {
      pushToast({ message: "Choose one file for each panel.", tone: "error" });
      return;
    }
    try {
      const text = await readTextCompareFile(files[0]);
      if (generation !== importGeneration.current[side]) return;
      importText(side, text);
      useEditorUIStore.getState().setIsInputExpanded(true);
      pushToast({ message: `${side === "left" ? "Original" : "Modified"} file imported.`, tone: "success" });
    } catch (error) {
      if (generation !== importGeneration.current[side]) return;
      pushToast({ message: error instanceof TextImportError ? error.message : "The file could not be imported.", tone: "error" });
    }
  }, [importText, pushToast]);
  const openFilePicker = useCallback((side: "left" | "right") => {
    (side === "left" ? leftFileRef : rightFileRef).current?.click();
  }, []);
  const hasInput = Boolean(leftText || rightText);
  const showTextTest = useEditorUIStore((state) => state.showTextTest);
  const { isInputExpanded, toggleInputPanel, isOptionsPanelOpen, setIsOptionsPanelOpen, optionsPanelTab, setOptionsPanelTab } = useEditorUIStore();
  const hasResult = comparisonResult && comparisonResult.blocks.length > 0;
  const isInputEditorToggleDisabled = !hasResult && isInputExpanded;
  const toggleOptionsPanel = useCallback(() => {
    if (!hasInput) return;
    const uiState = useEditorUIStore.getState();
    uiState.setIsOptionsPanelOpen(uiState.optionsPanelTab !== "options" || !uiState.isOptionsPanelOpen);
    uiState.setOptionsPanelTab("options");
  }, [hasInput]);

  useEffect(() => {
    if (!hasInput && isOptionsPanelOpen && optionsPanelTab === "options") setIsOptionsPanelOpen(false);
  }, [hasInput, isOptionsPanelOpen, optionsPanelTab, setIsOptionsPanelOpen]);

  useOptionsPanelShortcut(toggleOptionsPanel);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isWorkspaceShortcutBlocked(event)) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key !== "e") {
        return;
      }

      if (event.repeat) {
        return;
      }

      if (key === "e" && isInputEditorToggleDisabled) {
        return;
      }

      event.preventDefault();

      toggleInputPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isInputEditorToggleDisabled, toggleInputPanel]);

  return (
    <ToolWorkspaceShell
      contentClassName="overflow-y-auto custom-scrollbar"
      isPanelOpen={isOptionsPanelOpen}
      onPanelOpenChange={setIsOptionsPanelOpen}
      activePanelTab={optionsPanelTab}
      onPanelTabChange={setOptionsPanelTab}
      toolTitle="Text compare"
      toolIcon={MdCode}
      compactControls={<div className="flex min-w-0 flex-1 items-center gap-3 self-stretch">
        {showTextTest && <TextTestButton />}
        {!(isOptionsPanelOpen && optionsPanelTab === "options") && <CompactTextOptions disabled={!hasInput} />}
      </div>}
      tabs={[
        { value: "options", title: "Options", icon: MdTune, content: <OptionsView />, isDisabled: !hasInput },
        { value: "history", title: "Merge history", placement: "right", icon: MdHistory, content: <MergeHistoryView /> }
      ]}
    >
      <input ref={leftFileRef} type="file" accept={TEXT_IMPORT_ACCEPT} className="hidden" onChange={(event) => { if (event.target.files) void handleImportFiles("left", event.target.files); event.target.value = ""; }} />
      <input ref={rightFileRef} type="file" accept={TEXT_IMPORT_ACCEPT} className="hidden" onChange={(event) => { if (event.target.files) void handleImportFiles("right", event.target.files); event.target.value = ""; }} />
      <div
        className={cn(
          "flex min-h-0 flex-col bg-bg-primary relative",
          hasResult || !isInputExpanded ? "min-h-48 flex-1 overflow-hidden" : "shrink-0 h-0"
        )}
      >
        <FileDropZone
          className="flex min-h-0 flex-1 flex-col"
          label={<div className="grid h-full w-full grid-cols-2 text-center"><span className={cn("flex items-center justify-center", dropSide === "left" && "bg-accent-primary/15")}>Drop into original</span><span className={cn("flex items-center justify-center", dropSide === "right" && "bg-accent-primary/15")}>Drop into modified</span></div>}
          onFileDrag={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setDropSide(event.clientX < bounds.left + bounds.width / 2 ? "left" : "right");
          }}
          onFilesDrop={(files, event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            void handleImportFiles(event.clientX < bounds.left + bounds.width / 2 ? "left" : "right", files);
          }}
        >
          <ComparisonView onImport={openFilePicker} />
        </FileDropZone>
      </div>

      <div className="shrink-0 border-t border-border-default bg-bg-secondary px-2 py-1.5 sm:px-3 sm:py-2">
        <div className="flex items-center justify-center">
          <Button size="sm"
            onClick={toggleInputPanel}
            disabled={isInputEditorToggleDisabled}
            title={isInputExpanded ? "Hide input editor (E)" : "Show input editor (E)"}
          >
            <MdBorderColor className="text-base shrink-0" />
            <span>Input editor</span>
            {isInputExpanded ? <MdKeyboardArrowDown className="text-xl shrink-0" /> : <MdKeyboardArrowUp className="text-xl shrink-0" />}
          </Button>
        </div>
      </div>

      <div
        inert={!isInputExpanded}
        className={cn(
          "flex min-h-0 flex-col shrink-0 overflow-hidden bg-bg-primary z-10 transition-[height,min-height,opacity] duration-200 ease-in-out motion-reduce:transition-none",
          isInputExpanded
            ? (hasResult
              ? "h-1/2 min-h-64 border-t border-border-default opacity-100"
              : "min-h-64 flex-1 opacity-100")
            : "h-0 min-h-0 opacity-0"
        )}
      >
        <InputView onImportFiles={handleImportFiles} onOpenFile={openFilePicker} />
      </div>
    </ToolWorkspaceShell>
  );
}


