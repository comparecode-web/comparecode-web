"use client";

import { useState, useMemo } from "react";
import { MdContentCopy, MdSwapHoriz, MdDelete, MdDescription, MdCheck } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCompareActions } from "@/hooks/useCompareActions";
import { calculateStats } from "@/utils/diffHelpers";
import { Button } from "@/components/ui/Button";

export function ComparisonToolbar() {
  const { comparisonResult, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();
  const { executeClear, executeSwap } = useCompareActions();

  const [copiedSide, setCopiedSide] = useState<"left" | "right" | null>(null);

  const stats = useMemo(() => {
    return calculateStats(comparisonResult?.blocks, settings.ignoreWhitespace);
  }, [comparisonResult, settings.ignoreWhitespace]);

  const leftLineCount = useMemo(() => leftText ? leftText.split(/\r?\n/).length : 0, [leftText]);

  const rightLineCount = useMemo(() => rightText ? rightText.split(/\r?\n/).length : 0, [rightText]);

  const handleCopy = (text: string, side: "left" | "right") => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSide(side);
    setTimeout(() => {
      setCopiedSide((prev) => (prev === side ? null : prev));
    }, 2000);
  };

  return (
    <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary px-2 sm:px-4 h-[var(--header-height)] shrink-0 z-20 select-none">

      <div className="flex flex-1 items-center justify-between min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <MdDescription className="text-xl text-text-secondary shrink-0" />
          <span className="font-bold text-danger text-sm">{stats.removals}<span className="hidden min-[400px]:inline"> -</span></span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <span className="text-xs sm:text-sm text-text-secondary hidden md:block">{leftLineCount} lines</span>

          <button
            onClick={() => handleCopy(leftText, "left")}
            disabled={copiedSide === "left" || !leftText}
            className="flex items-center gap-1.5 text-accent-primary hover:bg-hover-overlay px-2 py-1.5 rounded disabled:text-success disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-[var(--duration-short)]"
            title="Copy Original Text"
          >
            {copiedSide === "left" ? (
              <MdCheck className="text-xl" />
            ) : (
              <MdContentCopy className="text-xl" />
            )}
            <span className="text-xs font-bold hidden sm:inline">{copiedSide === "left" ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      <button onClick={() => executeSwap(settings)} className="mx-3 sm:mx-6 text-2xl text-accent-primary hover:bg-hover-overlay p-1.5 rounded transition-colors duration-[var(--duration-short)] shrink-0" title="Swap Sides">
        <MdSwapHoriz />
      </button>

      <div className="flex flex-1 items-center justify-between min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <MdDescription className="text-xl text-text-secondary shrink-0" />
          <span className="font-bold text-success text-sm">{stats.additions}<span className="hidden min-[400px]:inline"> +</span></span>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <span className="text-xs sm:text-sm text-text-secondary hidden md:block">{rightLineCount} lines</span>

          <button
            onClick={() => handleCopy(rightText, "right")}
            disabled={copiedSide === "right" || !rightText}
            className="flex items-center gap-1.5 text-accent-primary hover:bg-hover-overlay px-2 py-1.5 rounded disabled:text-success disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-[var(--duration-short)]"
            title="Copy Modified Text"
          >
            {copiedSide === "right" ? (
              <MdCheck className="text-xl" />
            ) : (
              <MdContentCopy className="text-xl" />
            )}
            <span className="text-xs font-bold hidden sm:inline">{copiedSide === "right" ? "Copied" : "Copy"}</span>
          </button>
          <div className="w-px h-6 bg-border-default mx-2" />
          <Button
            variant="danger"
            size="sm"
            onClick={executeClear}
            leftIcon={<MdDelete className="text-xl" />}
            title="Clear comparison"
            className="hidden md:inline-flex"
          >
            Clear
          </Button>
          <button
            onClick={executeClear}
            className="md:hidden p-2 text-danger hover:bg-hover-overlay rounded transition-colors"
            title="Clear comparison"
          >
            <MdDelete className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}