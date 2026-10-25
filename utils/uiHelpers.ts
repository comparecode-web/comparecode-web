import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function getWordWrapClass(isWordWrapEnabled: boolean, extraClasses: string = ""): string {
  return cn(
    isWordWrapEnabled ? "break-all whitespace-pre-wrap" : "whitespace-pre",
    extraClasses
  );
}