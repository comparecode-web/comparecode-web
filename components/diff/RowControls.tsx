import { MdEast, MdWest, MdClose } from "react-icons/md";
import { ChangeBlock } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import clsx from "clsx";

interface RowControlsProps {
  block: ChangeBlock;
  settings: AppSettings;
  layout: "split-wrap" | "split-left" | "split-right" | "unified";
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
}

export function RowControls({ block, settings, layout, selectBlock, mergeBlock }: RowControlsProps) {
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

  if (layout === "unified") {
    return (
      <div className="flex items-center justify-center w-full min-w-full border-t border-accent-primary bg-bg-selected relative h-12 z-20 select-none">
        <div className="sticky left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 px-4 h-full w-max">
          <button onClick={handleMergeLeftToRight} className="flex items-center gap-2 rounded bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:bg-danger-hover transition-colors">
            <span>Merge</span>
            <MdEast />
          </button>
          <button onClick={handleClose} className="rounded p-1 text-text-secondary hover:bg-hover-overlay transition-colors mx-2">
            <MdClose className="text-xl" />
          </button>
          <button onClick={handleMergeRightToLeft} className="flex items-center gap-2 rounded bg-success px-4 py-1.5 text-sm font-semibold text-white hover:bg-success-hover transition-colors">
            <MdWest />
            <span>Merge</span>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary z-20 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center w-full min-w-full border-t border-accent-primary bg-bg-selected relative h-12 z-20 select-none", layout === "split-wrap" ? "justify-between px-2 sm:px-4" : layout === "split-left" ? "justify-end" : "justify-start")}>
      {layout === "split-wrap" && (
        <>
          <div className="flex items-center gap-4 flex-1 justify-end pr-4 border-r border-transparent">
            <button onClick={handleMergeLeftToRight} className="flex items-center gap-2 rounded bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:bg-danger-hover transition-colors">
              <span>Merge</span><MdEast />
            </button>
          </div>
          <button onClick={handleClose} className="rounded p-1 text-text-secondary hover:bg-hover-overlay transition-colors shrink-0">
            <MdClose className="text-xl" />
          </button>
          <div className="flex items-center gap-4 flex-1 justify-start pl-4">
            <button onClick={handleMergeRightToLeft} className="flex items-center gap-2 rounded bg-success px-4 py-1.5 text-sm font-semibold text-white hover:bg-success-hover transition-colors">
              <MdWest /><span>Merge</span>
            </button>
          </div>
        </>
      )}
      {layout === "split-left" && (
        <div className="sticky right-0 flex items-center justify-end gap-4 px-4 h-full">
          <button onClick={handleMergeLeftToRight} className="flex items-center gap-2 rounded bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:bg-danger-hover transition-colors">
            <span>Merge</span><MdEast />
          </button>
          <button onClick={handleClose} className="rounded p-1 text-text-secondary hover:bg-hover-overlay transition-colors">
            <MdClose className="text-xl" />
          </button>
        </div>
      )}
      {layout === "split-right" && (
        <div className="sticky left-0 flex items-center justify-start px-4 h-full">
          <button onClick={handleMergeRightToLeft} className="flex items-center gap-2 rounded bg-success px-4 py-1.5 text-sm font-semibold text-white hover:bg-success-hover transition-colors">
            <MdWest /><span>Merge</span>
          </button>
        </div>
      )}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary z-20 pointer-events-none" />
    </div>
  );
}