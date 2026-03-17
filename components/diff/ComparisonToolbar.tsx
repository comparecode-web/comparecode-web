"use client";

import { useState, useMemo } from "react";
import { MdContentCopy, MdSwapHoriz, MdDelete, MdDescription, MdCheck } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCompareActions } from "@/hooks/useCompareActions";
import { calculateStats } from "@/utils/diffHelpers";

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
    <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary px-4 py-1.5 shrink-0 z-20 select-none">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <MdDescription className="text-xl text-text-secondary" />
          <span className="font-bold text-danger text-sm">{stats.removals} removals</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{leftLineCount} lines</span>
   
          <button
            onClick={() => handleCopy(leftText, "left")}
            disabled={copiedSide === "left" || !leftText}
            className="flex items-center gap-1 text-accent-primary hover:bg-hover-overlay px-2 py-1.5 rounded disabled:text-success disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            title="Copy Original Text"
          >
            {copiedSide === "left" ? (
              <>
                <MdCheck className="text-lg" />
                <span className="text-xs font-bold">Copied</span>
              </>
            ) : (
              <>
                <MdContentCopy className="text-lg" />
                <span className="text-xs font-bold">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <button onClick={() => executeSwap(settings)} className="mx-6 text-2xl text-accent-primary hover:bg-hover-overlay p-1.5 rounded" title="Swap Sides">
        <MdSwapHoriz />
      </button>

      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <MdDescription className="text-xl text-text-secondary" />
          <span className="font-bold text-success text-sm">{stats.additions} additions</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{rightLineCount} lines</span>
         
          <button
            onClick={() => handleCopy(rightText, "right")}
            disabled={copiedSide === "right" || !rightText}
            className="flex items-center gap-1 text-accent-primary hover:bg-hover-overlay px-2 py-1.5 rounded disabled:text-success disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            title="Copy Modified Text"
          >
            {copiedSide === "right" ? (
              <>
                <MdCheck className="text-lg" />
                <span className="text-xs font-bold">Copied</span>
              </>
            ) : (
              <>
                <MdContentCopy className="text-lg" />
                <span className="text-xs font-bold">Copy</span>
              </>
            )}
          </button>
          <div className="w-px h-6 bg-border-default mx-2" />
          <button onClick={executeClear} className="flex items-center gap-1 bg-danger-bg text-danger border border-danger/20 px-3 py-1.5 rounded text-sm font-semibold hover:brightness-95 transition-all">
            <MdDelete className="text-lg" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}