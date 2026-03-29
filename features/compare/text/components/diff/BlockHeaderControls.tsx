"use client";

import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";

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
    <div className="flex items-center justify-center gap-6 mx-1 mt-1 bg-bg-primary relative h-10 z-20 select-none px-4 border-t border-l border-r border-border-default rounded-t-xl shadow-sm">
      <div className="flex items-center gap-2">
        <button onClick={handlePrev} className="flex items-center justify-center gap-1 rounded px-(--btn-px) h-(--btn-height) text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors outline-none" title="Jump to previous difference">
          <MdKeyboardArrowUp className="text-lg" />
          <span>Jump previous</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold text-text-primary bg-bg-secondary px-3 py-1 rounded-full border border-border-default shadow-sm">
        <span>{currentBlockIndex} / {totalSelectableBlocks}</span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleNext} className="flex items-center justify-center gap-1 rounded px-(--btn-px) h-(--btn-height) text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors outline-none" title="Jump to next difference">
          <span>Jump next</span>
          <MdKeyboardArrowDown className="text-lg" />
        </button>
      </div>
    </div>
  );
}


