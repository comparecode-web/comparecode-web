import { RefObject, useCallback } from "react";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import { TextTransformError } from "@/features/compare/text/services/transforms/textTransforms";

export type TransformSide = "left" | "right";
export type TransformTarget = TransformSide | "both";
export type TransformOutput = string | { text: string; warning?: string };
export type TransformRun = (text: string) => TransformOutput;

export const NATIVE_EDIT_LIMIT = 1_000_000;
const UNDO_TOAST_DURATION_MS = 8000;

function replaceWithNativeUndo(textarea: HTMLTextAreaElement | null, next: string): boolean {
  if (!textarea || textarea.closest("[inert]") || next.length > NATIVE_EDIT_LIMIT || textarea.value.length > NATIVE_EDIT_LIMIT) return false;
  try {
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
    const applied = next ? document.execCommand("insertText", false, next) : document.execCommand("delete");
    return applied && textarea.value === next;
  } catch {
    return false;
  }
}

export function useTextTransforms(textareas: Record<TransformSide, RefObject<HTMLTextAreaElement | null>>) {
  const { executeCompare } = useTextCompareActions();

  return useCallback((target: TransformTarget, transform: TransformRun) => {
    const store = useEditorStore.getState();
    const pushToast = useToastStore.getState().pushToast;
    const sides: TransformSide[] = target === "both" ? ["left", "right"] : [target];
    const current: Record<TransformSide, string> = { left: store.leftText, right: store.rightText };
    const next: Partial<Record<TransformSide, string>> = {};
    const warnings = new Set<string>();
    try {
      for (const side of sides) {
        const output = transform(current[side]);
        next[side] = typeof output === "string" ? output : output.text;
        if (typeof output !== "string" && output.warning) warnings.add(output.warning);
      }
    } catch (error) {
      pushToast({ message: error instanceof TextTransformError ? error.message : "The text could not be transformed.", tone: "error" });
      return;
    }
    const changed = sides.filter((side) => next[side] !== current[side]);
    if (!changed.length) {
      pushToast({ message: "The text is already in this form.", tone: "info", dedupeKey: "transform-unchanged" });
      return;
    }
    for (const warning of warnings) pushToast({ message: warning, tone: "warning", dedupeKey: warning });
    const fallback: TransformSide[] = [];
    for (const side of changed) {
      const value = next[side]!;
      if (replaceWithNativeUndo(textareas[side].current, value)) continue;
      (side === "left" ? store.setLeftText : store.setRightText)(value);
      fallback.push(side);
    }
    if (fallback.length) {
      pushToast({
        message: "Text transformed.",
        tone: "success",
        durationMs: UNDO_TOAST_DURATION_MS,
        action: {
          label: "Undo",
          onAction: () => {
            const latest = useEditorStore.getState();
            for (const side of fallback) {
              const now = side === "left" ? latest.leftText : latest.rightText;
              if (now === next[side]) (side === "left" ? latest.setLeftText : latest.setRightText)(current[side]);
            }
            if (useEditorStore.getState().comparisonResult) void executeCompare(useSettingsStore.getState().settings, false, true);
          }
        }
      });
    }
    if (useEditorStore.getState().comparisonResult) void executeCompare(useSettingsStore.getState().settings, false, true);
  }, [executeCompare, textareas]);
}
