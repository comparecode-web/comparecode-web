import clsx from "clsx";

export function getRowContainerClass(isSelectable: boolean, isSelected: boolean): string {
  return clsx(
    "flex flex-col w-full relative",
    isSelectable && "cursor-pointer",
    isSelected && isSelectable && "bg-bg-selected"
  );
}

export function getWordWrapClass(isWordWrapEnabled: boolean, extraClasses: string = ""): string {
  return clsx(
    isWordWrapEnabled ? "break-all whitespace-pre-wrap" : "whitespace-pre",
    extraClasses
  );
}