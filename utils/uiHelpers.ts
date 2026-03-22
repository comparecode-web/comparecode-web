import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function getRowContainerClass(isSelectable: boolean, isSelected: boolean): string {
  return cn(
    "flex flex-col relative border-l-2 border-r-2 transition-colors",
    isSelectable ? "cursor-pointer" : "border-transparent",
    isSelected && isSelectable ? "bg-bg-primary border-border-default mx-2" : "border-transparent w-full"
  );
}

export function getWordWrapClass(isWordWrapEnabled: boolean, extraClasses: string = ""): string {
  return cn(
    isWordWrapEnabled ? "break-all whitespace-pre-wrap" : "whitespace-pre",
    extraClasses
  );
}