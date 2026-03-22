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

  const absoluteCenteredCloseButton = (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30">
      <button onClick={handleClose} className="rounded p-1 text-text-secondary hover:bg-hover-overlay transition-colors" title="Close block">
        <MdClose className="text-xl" />
      </button>
    </div>
  );

  const inlineCloseButton = (
    <button onClick={handleClose} className="rounded p-1 text-text-secondary hover:bg-hover-overlay transition-colors shrink-0" title="Close block">
      <MdClose className="text-xl" />
    </button>
  );

  const mergeLeftToRightButton = (
    <button onClick={handleMergeLeftToRight} className="flex items-center gap-2 rounded bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:bg-danger-hover transition-colors shadow-sm">
      <span>Merge</span>
      <MdEast />
    </button>
  );

  const mergeRightToLeftButton = (
    <button onClick={handleMergeRightToLeft} className="flex items-center gap-2 rounded bg-success px-4 py-1.5 text-sm font-semibold text-white hover:bg-success-hover transition-colors shadow-sm">
      <MdWest />
      <span>Merge</span>
    </button>
  );

  if (layout === "unified") {
    return (
      <div className="flex items-center mx-2 bg-bg-primary relative h-12 z-20 select-none border-b-2 border-l-2 border-r-2 border-border-default rounded-b-xl">
        <div className="sticky left-0 flex items-center w-full px-4 h-full">
          <div className="flex-1 flex justify-end pr-8">
            {mergeLeftToRightButton}
          </div>
          {absoluteCenteredCloseButton}
          <div className="flex-1 flex justify-start pl-8">
            {mergeRightToLeftButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center mx-2 bg-bg-primary relative h-12 z-20 select-none border-b-2 border-l-2 border-r-2 border-border-default rounded-b-xl", layout === "split-wrap" ? "justify-between" : layout === "split-left" ? "justify-end" : "justify-start")}>
      {layout === "split-wrap" && (
        <div className="sticky left-0 flex items-center w-full h-full px-4">
          <div className="flex-1 flex justify-end pr-8">
            {mergeLeftToRightButton}
          </div>
          {absoluteCenteredCloseButton}
          <div className="flex-1 flex justify-start pl-8">
            {mergeRightToLeftButton}
          </div>
        </div>
      )}
      {layout === "split-left" && (
        <div className="sticky right-0 flex items-center justify-end gap-4 px-4 h-full pr-8">
          {mergeLeftToRightButton}
          {inlineCloseButton}
        </div>
      )}
      {layout === "split-right" && (
        <div className="sticky left-0 flex items-center justify-start gap-4 px-4 h-full pl-8">
          {inlineCloseButton}
          {mergeRightToLeftButton}
        </div>
      )}
    </div>
  );
}