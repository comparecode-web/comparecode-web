"use client";

import { useMemo, useState } from "react";
import { MdCheck, MdContentCopy, MdDelete, MdFileOpen, MdSwapHoriz } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { calculateStats } from "@/features/compare/text/utils/diffHelpers";
import { UI_CONSTANTS } from "@/config/constants";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ExportDialog } from "./ExportDialog";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";

export function ComparisonToolbar({ onImport }: { onImport: (side: "left" | "right") => void }) {
  const { comparisonResult, leftText, rightText } = useEditorStore();
  const settings = useSettingsStore((state) => state.settings);
  const { executeClear, executeSwap } = useTextCompareActions();
  const [copiedSide, setCopiedSide] = useState<"left" | "right" | null>(null);
  const stats = useMemo(() => calculateStats(comparisonResult?.blocks), [comparisonResult]);

  const copy = async (side: "left" | "right") => {
    const text = side === "left" ? leftText : rightText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSide(side);
      window.setTimeout(() => setCopiedSide((current) => current === side ? null : current), UI_CONSTANTS.COPY_FEEDBACK_TIMEOUT_MS);
    } catch {
      // Clipboard access depends on browser permission.
    }
  };

  return <WorkspaceToolbar className="flex-wrap gap-y-0.5 @xl/workspace:flex-nowrap @lg/workspace:px-2">
    <div className="flex min-w-0 flex-1 items-center justify-between gap-0.5">
      <span className="shrink-0 text-xs font-bold text-danger @lg/workspace:text-sm"><span className="@3xl/workspace:hidden">-{stats.removals}</span><span className="hidden @3xl/workspace:inline">{stats.removals} removals</span></span>
      <div className="flex shrink-0 items-center gap-0.5">
        <CopyButton side="left" disabled={!leftText || copiedSide === "left"} copied={copiedSide === "left"} onClick={() => void copy("left")} />
        <IconButton size="sm" aria-label="Import original text file" title="Import" onClick={() => onImport("left")}><MdFileOpen /></IconButton>
      </div>
    </div>
    <IconButton size="sm" className="text-accent-primary" aria-label="Swap sides" title="Swap sides" disabled={!leftText && !rightText} onClick={() => executeSwap(settings)}><MdSwapHoriz /></IconButton>
    <div className="flex min-w-0 flex-1 items-center justify-between gap-0.5">
      <span className="shrink-0 text-xs font-bold text-success @lg/workspace:text-sm"><span className="@3xl/workspace:hidden">+{stats.additions}</span><span className="hidden @3xl/workspace:inline">{stats.additions} additions</span></span>
      <div className="flex shrink-0 items-center gap-0.5">
        <CopyButton side="right" disabled={!rightText || copiedSide === "right"} copied={copiedSide === "right"} onClick={() => void copy("right")} />
        <IconButton size="sm" aria-label="Import modified text file" title="Import" onClick={() => onImport("right")}><MdFileOpen /></IconButton>
      </div>
    </div>
    <div className="flex w-full shrink-0 items-center justify-end gap-1 border-t border-border-default pt-0.5 @xl/workspace:w-auto @xl/workspace:border-t-0 @xl/workspace:pt-0">
      <ExportDialog result={comparisonResult} original={leftText} modified={rightText} />
      <Button size="sm" variant="danger" aria-label="Clear comparison" disabled={!leftText && !rightText} onClick={executeClear} leftIcon={<MdDelete />}>Clear</Button>
    </div>
  </WorkspaceToolbar>;
}

function CopyButton({ side, disabled, copied, onClick }: { side: "left" | "right"; disabled: boolean; copied: boolean; onClick: () => void }) {
  return <Button size="sm" variant="ghost" className="px-1.5 text-accent-primary hover:text-accent-primary" aria-label={`Copy ${side === "left" ? "original" : "modified"} text`} disabled={disabled} onClick={onClick} leftIcon={copied ? <MdCheck className="text-lg" /> : <MdContentCopy className="text-lg" />}>
    {copied ? "Copied" : "Copy"}
  </Button>;
}
