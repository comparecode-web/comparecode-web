import { MdEast, MdWest, MdClose } from "react-icons/md";
import { ChangeBlock } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

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
    <div className="flex items-center mx-1 mb-1 bg-bg-primary relative h-12 z-20 select-none border-b border-l border-r border-border-default rounded-b-xl shadow-sm">
      <div className="sticky left-0 flex items-center w-full px-4 h-full">
        <div className="flex-1 flex justify-end pr-8">
          <Button size="sm" variant="danger" onClick={handleMergeLeftToRight}>
            <span>Merge</span>
            <MdEast />
          </Button>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30">
          <IconButton size="sm" onClick={handleClose} title="Close block">
            <MdClose className="text-xl" />
          </IconButton>
        </div>

        <div className="flex-1 flex justify-start pl-8">
          <Button size="sm" variant="success" onClick={handleMergeRightToLeft}>
            <MdWest />
            <span>Merge</span>
          </Button>
        </div>
      </div>
    </div>
  );
}


