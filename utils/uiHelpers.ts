import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function getRowContainerClass(isSelectable: boolean, isSelected: boolean): string {
  return cn(
    "flex flex-col w-full relative",
    isSelectable && "cursor-pointer",
    isSelected && isSelectable && "bg-bg-selected"
  );
}

export function getWordWrapClass(isWordWrapEnabled: boolean, extraClasses: string = ""): string {
  return cn(
    isWordWrapEnabled ? "break-all whitespace-pre-wrap" : "whitespace-pre",
    extraClasses
  );
}