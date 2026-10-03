"use client";

import { useCallback, useEffect, useRef } from "react";
import { MdArticle, MdHistory, MdTune } from "react-icons/md";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";
import { useOptionsPanelShortcut } from "@/components/layout/useOptionsPanelShortcut";
import { MarkdownHistoryView } from "./MarkdownHistoryView";
import { MarkdownLayoutControl, MarkdownOptionsView } from "./MarkdownOptionsView";
import { MarkdownSplitView } from "./MarkdownSplitView";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { Button } from "@/components/ui/Button";
import { useMarkdownFormattingActions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { flushMarkdownContentSave, scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

function MarkdownLoadingView() {
  return (
    <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-primary sm:grid-cols-[1fr_0.5rem_1fr]">
      <section className="min-h-0 min-w-0 overflow-hidden border-r border-border-default max-sm:border-r-0">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold text-text-secondary">
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
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold text-text-secondary">
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
  const resetMarkdownText = useMarkdownStore((state) => state.resetMarkdownText);
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
  const hasContent = isMarkdownReady && markdownText.trim().length > 0;
  const toggleOptionsPanel = useCallback(() => {
    if (!hasContent) return;
    const uiState = useMarkdownUIStore.getState();
    uiState.setIsOptionsPanelOpen(uiState.optionsPanelTab !== "options" || !uiState.isOptionsPanelOpen);
    uiState.setOptionsPanelTab("options");
  }, [hasContent]);

  useEffect(() => {
    if (isMarkdownReady && !hasContent && isOptionsPanelOpen && optionsPanelTab === "options") setIsOptionsPanelOpen(false);
  }, [isMarkdownReady, hasContent, isOptionsPanelOpen, optionsPanelTab, setIsOptionsPanelOpen]);

  useOptionsPanelShortcut(toggleOptionsPanel);

  const { applyFormat } = useMarkdownFormattingActions({
    textareaRef,
    onChange: setMarkdownText
  });

  useEffect(() => {
    loadPersistedMarkdownText();
    loadPersistedMarkdownUIState();
    const flush = () => flushMarkdownContentSave();
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
      contentClassName="w-full max-w-full"
      compactControls={<div className="flex min-w-0 flex-1 items-center gap-3 self-stretch"><Button size="sm" variant="primary" className="shrink-0 whitespace-nowrap" onClick={resetMarkdownText}>Test text</Button>{!(isOptionsPanelOpen && optionsPanelTab === "options") && <div className="hidden items-center gap-2 @xl/workspace:flex"><span className="hidden text-xs text-text-secondary @2xl/workspace:inline">Layout</span><fieldset disabled={!hasContent} className={!hasContent ? "opacity-50" : undefined}><MarkdownLayoutControl /></fieldset></div>}</div>}
      toolTitle="Markdown preview"
      toolIcon={MdArticle}
      tabs={[
        { value: "options", title: "Options", icon: MdTune, content: <MarkdownOptionsView />, isDisabled: !hasContent },
        { value: "history", title: "Markdown history", placement: "right", icon: MdHistory, content: <MarkdownHistoryView /> }
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
