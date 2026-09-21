"use client";

import { useState, useMemo } from "react";
import { MdContentCopy, MdSwapHoriz, MdDelete, MdDescription, MdCheck } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { calculateStats } from "@/features/compare/text/utils/diffHelpers";
import { Button } from "@/components/ui/Button";
import { UI_CONSTANTS } from "@/config/constants";

export function ComparisonToolbar() {
  const { comparisonResult, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();
  const { executeClear, executeSwap } = useTextCompareActions();

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
    }, UI_CONSTANTS.COPY_FEEDBACK_TIMEOUT_MS);
  };

  return (
    <div data-tool-controls className="flex min-h-(--header-height) shrink-0 items-center justify-between gap-1 border-b border-border-default bg-bg-secondary px-2 py-1 z-20 select-none @3xl/workspace:px-4">
      <div className="flex flex-1 items-center justify-between gap-1 min-w-0">
        <StatDisplay type="removals" count={stats.removals} />
        <div className="flex items-center gap-1 @3xl/workspace:gap-4">
          <span className="hidden text-sm text-text-secondary @5xl/workspace:block">{leftLineCount} lines</span>
          <CopyButton text={leftText} side="left" copiedSide={copiedSide} onCopy={handleCopy} />
        </div>
      </div>

      <button onClick={() => executeSwap(settings)} className="mx-1 @3xl/workspace:mx-4 text-2xl text-accent-primary hover:bg-hover-overlay p-2 rounded transition-colors duration-(--duration-short) shrink-0" title="Swap sides">
        <MdSwapHoriz />
      </button>

      <div className="flex flex-[1.5] items-center justify-between gap-1 min-w-0 @3xl/workspace:flex-1">
        <StatDisplay type="additions" count={stats.additions} />
        <div className="flex items-center gap-1 @3xl/workspace:gap-4">
          <span className="hidden text-sm text-text-secondary @5xl/workspace:block">{rightLineCount} lines</span>
          <CopyButton text={rightText} side="right" copiedSide={copiedSide} onCopy={handleCopy} />
          <div className="w-px h-6 bg-border-default mx-1" />
          <ClearButton onClear={executeClear} />
        </div>
      </div>
    </div>
  );
}

interface StatDisplayProps {
  type: "removals" | "additions";
  count: number;
}

function StatDisplay({ type, count }: StatDisplayProps) {
  const isRemovals = type === "removals";
  const textColor = isRemovals ? "text-danger" : "text-success";
  const sign = isRemovals ? "-" : "+";
  const label = isRemovals ? "removals" : "additions";

  return (
    <div className="flex shrink-0 items-center gap-1 whitespace-nowrap @3xl/workspace:gap-2">
      <MdDescription className="hidden text-xl text-text-secondary shrink-0 @lg/workspace:block" />
      <span className={`font-bold ${textColor} text-sm`}>
        <span className="inline @3xl/workspace:hidden">{count} {sign}</span>
        <span className="hidden @3xl/workspace:inline">{count} {label}</span>
      </span>
    </div>
  );
}

interface CopyButtonProps {
  text: string;
  side: "left" | "right";
  copiedSide: "left" | "right" | null;
  onCopy: (text: string, side: "left" | "right") => void;
}

function CopyButton({ text, side, copiedSide, onCopy }: CopyButtonProps) {
  const isCopied = copiedSide === side;
  const title = side === "left" ? "Copy original text" : "Copy modified text";

  const isDisabled = isCopied || !text?.trim();

  return (
    <button
      onClick={() => onCopy(text, side)}
      disabled={isDisabled}
      className="flex min-h-10 items-center gap-1 text-accent-primary hover:bg-hover-overlay px-2 py-1.5 rounded disabled:text-text-secondary disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors duration-(--duration-short)"
      title={title}
    >
      {isCopied ? <MdCheck className="text-xl" /> : <MdContentCopy className="text-xl" />}
      <span className="text-sm font-semibold hidden @3xl/workspace:inline">{isCopied ? "Copied" : "Copy"}</span>
    </button>
  );
}

interface ClearButtonProps {
  onClear: () => void;
}

function ClearButton({ onClear }: ClearButtonProps) {
  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={onClear}
        leftIcon={<MdDelete className="text-xl" />}
        title="Clear comparison"
        className="hidden @3xl/workspace:inline-flex"
      >
        Clear
      </Button>
      <button
        onClick={onClear}
        className="@3xl/workspace:hidden p-2 text-danger hover:bg-hover-overlay rounded transition-colors"
        title="Clear comparison"
      >
        <MdDelete className="text-xl" />
      </button>
    </>
  );
}


