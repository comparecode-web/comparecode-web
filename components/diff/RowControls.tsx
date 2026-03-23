import { MdEast, MdWest, MdClose } from "react-icons/md";
import { ChangeBlock } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";

interface RowControlsProps {
  block: ChangeBlock;
  settings: AppSettings;
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
}

export function RowControls({ block, settings, selectBlock, mergeBlock }: RowControlsProps) {
  const handleMergeLeftToRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    mergeBlock(block, MergeDirection.LeftToRight, settings);
  };

  const handleMergeRightToLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    mergeBlock(block, MergeDirection.RightToLeft, settings);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectBlock(null);
  };

  return (
    <div className="flex items-center mx-1 bg-bg-primary relative h-[56px] z-20 select-none border-b border-l border-r border-border-default rounded-b-xl shadow-sm animate-slide-up-fade origin-bottom">
      <div className="sticky left-0 flex items-center w-full px-4 h-full">
        <div className="flex-1 flex justify-end pr-8">
          <button onClick={handleMergeLeftToRight} className="flex items-center justify-center gap-2 rounded bg-danger px-[var(--btn-px)] h-[var(--btn-height)] text-sm font-semibold text-white hover:bg-danger-hover transition-colors shadow-sm outline-none">
            <span>Merge</span>
            <MdEast />
          </button>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30">
          <button onClick={handleClose} className="flex items-center justify-center rounded h-[var(--btn-height)] w-[var(--btn-height)] text-text-secondary hover:bg-hover-overlay hover:text-text-primary transition-colors outline-none" title="Close block">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="flex-1 flex justify-start pl-8">
          <button onClick={handleMergeRightToLeft} className="flex items-center justify-center gap-2 rounded bg-success px-[var(--btn-px)] h-[var(--btn-height)] text-sm font-semibold text-white hover:bg-success-hover transition-colors shadow-sm outline-none">
            <MdWest />
            <span>Merge</span>
          </button>
        </div>
      </div>
    </div>
  );
}