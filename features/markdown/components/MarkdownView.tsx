"use client";

import { useCallback, useEffect, useRef } from "react";
import { MdHistory, MdTune } from "react-icons/md";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";
import { useOptionsPanelShortcut } from "@/components/layout/useOptionsPanelShortcut";
import { MarkdownHistoryView } from "./MarkdownHistoryView";
import { MarkdownOptionsView } from "./MarkdownOptionsView";
import { MarkdownSplitView } from "./MarkdownSplitView";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { useMarkdownFormattingActions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

function MarkdownLoadingView() {
  return (
    <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-primary sm:grid-cols-[1fr_0.5rem_1fr]">
      <section className="min-h-0 min-w-0 overflow-hidden border-r border-border-default max-sm:border-r-0">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Markdown
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-bg-primary text-sm font-semibold text-text-secondary">
            Loading markdown...
          </div>
        </div>
      </section>
      <div className="min-h-0 bg-border-default/35 max-sm:hidden" />
      <section className="min-h-0 min-w-0 overflow-hidden max-sm:hidden">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Preview
          </div>
          <div className="min-h-0 flex-1 bg-bg-primary" />
        </div>
      </section>
    </div>
  );
}

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
  const isMarkdownUILoaded = useMarkdownUIStore((state) => state.isLoaded);
  const loadPersistedMarkdownUIState = useMarkdownUIStore((state) => state.loadPersistedMarkdownUIState);
  const isMarkdownReady = isMarkdownLoaded && isMarkdownUILoaded;
  const toggleOptionsPanel = useCallback(() => {
    const uiState = useMarkdownUIStore.getState();
    uiState.setIsOptionsPanelOpen(!uiState.isOptionsPanelOpen);
  }, []);

  useOptionsPanelShortcut(toggleOptionsPanel);

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
    <ToolWorkspaceShell
      isPanelOpen={isOptionsPanelOpen}
      onPanelOpenChange={setIsOptionsPanelOpen}
      activePanelTab={optionsPanelTab}
      onPanelTabChange={setOptionsPanelTab}
      contentClassName="max-sm:w-[100dvw] max-sm:max-w-[100dvw]"
      tabs={[
        { value: "options", title: "Options", icon: MdTune, content: <MarkdownOptionsView /> },
        { value: "history", title: "Markdown History", icon: MdHistory, content: <MarkdownHistoryView /> }
      ]}
    >
      <MarkdownToolbar
        onFormat={applyFormat}
        onUndo={undoMarkdownText}
        onRedo={redoMarkdownText}
        canUndo={canUndo}
        canRedo={canRedo}
        isDisabled={!isMarkdownReady}
      />
      {isMarkdownReady ? (
        <MarkdownSplitView
          value={markdownText}
          onChange={setMarkdownText}
          textareaRef={textareaRef}
          onUndo={undoMarkdownText}
          onRedo={redoMarkdownText}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      ) : (
        <MarkdownLoadingView />
      )}
    </ToolWorkspaceShell>
  );
}
