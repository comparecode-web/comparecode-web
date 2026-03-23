import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function getRowContainerClass(isSelectable: boolean, isSelected: boolean): string {
  return cn(
    "flex flex-col relative border-l border-r transition-all duration-[var(--duration-medium)] ease-in-out mx-1",
    isSelectable ? "cursor-pointer" : "border-transparent",
    isSelected && isSelectable ? "bg-bg-primary border-border-default" : "bg-transparent border-transparent"
  );
}

export function getWordWrapClass(isWordWrapEnabled: boolean, extraClasses: string = ""): string {
  return cn(
    isWordWrapEnabled ? "break-all whitespace-pre-wrap" : "whitespace-pre",
    extraClasses
  );
}