import { cn } from "@/utils/uiHelpers";

export const ROW_FRAME_CLASS = "mx-1 border-l border-r";
export const LINE_NUMBER_GUTTER_CLASS = "shrink-0 w-[calc(var(--line-num-width,3ch)+1rem)]";
export const LINE_CELL_CLASS = "flex-1 mx-1";

export function getRowContainerClass(isSelectable: boolean, isSelected: boolean): string {
  return cn(
    "flex flex-col relative",
    ROW_FRAME_CLASS,
    isSelectable ? "cursor-pointer" : "border-transparent",
    isSelected && isSelectable ? "border-border-default" : "border-transparent"
  );
}
