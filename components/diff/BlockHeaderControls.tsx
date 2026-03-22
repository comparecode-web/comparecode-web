"use client";

import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";

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
    <div className="flex items-center justify-center gap-6 w-full min-w-full bg-bg-selected relative h-10 z-20 select-none px-4 shadow-sm">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-primary z-20 pointer-events-none" />
      
      <button onClick={handlePrev} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors">
        <MdKeyboardArrowUp className="text-lg" />
        <span>Jump previous</span>
      </button>

      <div className="flex items-center gap-2 text-xs font-bold text-accent-primary bg-accent-primary/10 px-3 py-1 rounded-full">
        <span>{currentBlockIndex} / {totalSelectableBlocks}</span>
      </div>

      <button onClick={handleNext} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors">
        <span>Jump next</span>
        <MdKeyboardArrowDown className="text-lg" />
      </button>
    </div>
  );
}