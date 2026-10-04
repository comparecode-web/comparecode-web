"use client";

import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { Button } from "@/components/ui/Button";

export function BlockHeaderControls() {
  const { currentBlockIndex, totalSelectableBlocks, jumpToNextBlock, jumpToPreviousBlock } = useEditorStore();

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    jumpToPreviousBlock();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    jumpToNextBlock();
  };

  return (
    <div className="flex items-center justify-center gap-2 @lg/workspace:gap-6 mx-1 mt-1 bg-bg-primary relative h-10 z-20 select-none px-2 @lg/workspace:px-4 border-t border-l border-r border-border-default rounded-t-xl shadow-sm">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={handlePrev} title="Jump to previous difference">
          <MdKeyboardArrowUp className="text-lg" />
            <span className="hidden @lg/workspace:inline">Jump previous</span>
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs font-bold text-text-primary bg-bg-secondary px-3 py-1 rounded-full border border-border-default shadow-sm">
        <span>{currentBlockIndex} / {totalSelectableBlocks}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={handleNext} title="Jump to next difference">
          <span className="hidden @lg/workspace:inline">Jump next</span>
          <MdKeyboardArrowDown className="text-lg" />
        </Button>
      </div>
    </div>
  );
}


