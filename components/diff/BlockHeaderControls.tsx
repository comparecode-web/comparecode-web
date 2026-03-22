"use client";

import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdKeyboardDoubleArrowUp, MdKeyboardDoubleArrowDown } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";

export function BlockHeaderControls() {
  const { currentBlockIndex, totalSelectableBlocks, jumpToNextBlock, jumpToPreviousBlock, scrollToTop, scrollToBottom } = useEditorStore();

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    jumpToPreviousBlock();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    jumpToNextBlock();
  };

  const handleTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToTop();
  };

  const handleBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToBottom();
  };

  return (
    <div className="flex items-center justify-center gap-6 mx-2 bg-bg-primary relative h-10 z-20 select-none px-4 border-t-2 border-l-2 border-r-2 border-border-default rounded-t-xl">
      <div className="flex items-center gap-2">
        <button onClick={handleTop} className="flex items-center justify-center rounded p-1.5 text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors" title="Jump to top">
          <MdKeyboardDoubleArrowUp className="text-xl" />
        </button>
        <button onClick={handlePrev} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors" title="Jump to previous difference">
          <MdKeyboardArrowUp className="text-lg" />
          <span>Jump previous</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold text-text-primary bg-bg-secondary px-3 py-1 rounded-full border border-border-default shadow-sm">
        <span>{currentBlockIndex} / {totalSelectableBlocks}</span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleNext} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors" title="Jump to next difference">
          <span>Jump next</span>
          <MdKeyboardArrowDown className="text-lg" />
        </button>
        <button onClick={handleBottom} className="flex items-center justify-center rounded p-1.5 text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors" title="Jump to bottom">
          <MdKeyboardDoubleArrowDown className="text-xl" />
        </button>
      </div>
    </div>
  );
}