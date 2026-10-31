import { useMemo } from "react";
import { ComparisonResult } from "@/features/compare/text/types/diff";
import { AppSettings } from "@/types/settings";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { getHiddenRanges, HiddenRange, UnchangedExpansions } from "@/features/compare/text/utils/unchangedRegions";

export function resolveHiddenRanges(comparisonResult: ComparisonResult | null, settings: Pick<AppSettings, "isHideUnchangedEnabled" | "unchangedContextLines">,
  expansions: UnchangedExpansions): Map<string, HiddenRange> | null {
  if (!comparisonResult || !settings.isHideUnchangedEnabled) return null;
  return getHiddenRanges(comparisonResult.blocks, { contextLines: settings.unchangedContextLines, expansions });
}

export function useHiddenRanges(comparisonResult: ComparisonResult | null, settings: AppSettings): Map<string, HiddenRange> | null {
  const expansions = useTextUIStore((state) => state.unchangedExpansions);
  const { isHideUnchangedEnabled, unchangedContextLines } = settings;
  return useMemo(() => resolveHiddenRanges(comparisonResult, { isHideUnchangedEnabled, unchangedContextLines }, expansions),
    [comparisonResult, isHideUnchangedEnabled, unchangedContextLines, expansions]);
}
