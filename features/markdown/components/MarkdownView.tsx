"use client";

import { useEffect, useRef } from "react";
import { MdHistory, MdTune } from "react-icons/md";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";
import { MarkdownHistoryView } from "./MarkdownHistoryView";
import { MarkdownOptionsView } from "./MarkdownOptionsView";
import { MarkdownSplitView } from "./MarkdownSplitView";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { useMarkdownFormattingActions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

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
    </ToolWorkspaceShell>
  );
}
