import { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdUnfoldMore } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/uiHelpers";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { type CollapsedRowInfo, UNCHANGED_REVEAL_STEP } from "@/features/compare/text/utils/unchangedRegions";

interface CollapsedRowProps {
  blockId: string;
  info: CollapsedRowInfo;
  virtualRow: VirtualItem;
  measureRef: (node: HTMLElement | null) => void;
}

const SEGMENT_CLASS = "h-auto min-h-0 self-stretch rounded-none border-0";

export const CollapsedRow = memo(({ blockId, info, virtualRow, measureRef }: CollapsedRowProps) => {
  const revealUnchanged = useTextUIStore((state) => state.revealUnchanged);
  const canRevealStep = info.hiddenCount > UNCHANGED_REVEAL_STEP;

  return (
    <div
      data-index={virtualRow.index}
      data-block-id={blockId}
      data-row-type="collapsed"
      ref={measureRef}
      className="absolute left-0 w-full px-1 py-1"
      style={{ top: virtualRow.start }}
    >
      <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-border-default bg-bg-secondary font-sans text-text-secondary">
        {canRevealStep && (
          <IconButton size="sm" className={SEGMENT_CLASS} aria-label={`Show ${UNCHANGED_REVEAL_STEP} more lines above`} title={`Show ${UNCHANGED_REVEAL_STEP} more lines above`}
            onClick={() => revealUnchanged(info.key, "above")}>
            <MdKeyboardArrowUp />
          </IconButton>
        )}
        {canRevealStep && <span aria-hidden="true" className="w-px shrink-0 bg-border-default" />}
        <Button size="sm" variant="ghost" className={cn(SEGMENT_CLASS, "min-w-0 flex-1 justify-center text-text-secondary")}
          leftIcon={<MdUnfoldMore />} onClick={() => revealUnchanged(info.key, "all")}>
          <span className="truncate">{info.hiddenCount} unchanged lines</span>
        </Button>
        {canRevealStep && <span aria-hidden="true" className="w-px shrink-0 bg-border-default" />}
        {canRevealStep && (
          <IconButton size="sm" className={SEGMENT_CLASS} aria-label={`Show ${UNCHANGED_REVEAL_STEP} more lines below`} title={`Show ${UNCHANGED_REVEAL_STEP} more lines below`}
            onClick={() => revealUnchanged(info.key, "below")}>
            <MdKeyboardArrowDown />
          </IconButton>
        )}
      </div>
    </div>
  );
});

CollapsedRow.displayName = "CollapsedRow";
