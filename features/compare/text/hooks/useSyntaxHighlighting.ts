import { useMemo } from "react";
import type { ComparisonResult } from "../types/diff";
import type { AppSettings } from "@/types/settings";
import { tokenizeSyntax } from "../services/syntax/tokenizeSyntax";

export function useSyntaxHighlighting(result: ComparisonResult | null, settings: AppSettings) {
  const language = settings.isSyntaxHighlightingEnabled ? settings.textSyntaxLanguage : "plain";
  const original = result?.sourceTexts?.original;
  const modified = result?.sourceTexts?.modified;
  const left = useMemo(() => tokenizeSyntax(original ?? "", language), [original, language]);
  const right = useMemo(() => modified === original ? left : tokenizeSyntax(modified ?? "", language), [modified, original, left, language]);
  return { left: left.lines, right: right.lines, limited: left.limited || right.limited };
}
