import { useCallback } from "react";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { DiffHistoryItem } from "@/types/history";
import { CompareSettings } from "@/types/settings";

export function useTextHistoryRestore() {
  const loadFromHistory = useEditorStore((state) => state.loadFromHistory);

  const restoreTextHistoryItem = useCallback((item: DiffHistoryItem, settings: CompareSettings) => {
    const originalText = item.snapshot?.mode === "text" ? item.snapshot.originalText : item.originalText;
    const modifiedText = item.snapshot?.mode === "text" ? item.snapshot.modifiedText : item.modifiedText;
    loadFromHistory(originalText, modifiedText, settings, item.id);
  }, [loadFromHistory]);

  return { restoreTextHistoryItem };
}
