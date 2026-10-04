import type { ComponentProps } from "react";
import { cn } from "@/utils/uiHelpers";

export function WorkspaceToolbar({ className, variant = "inline", ...props }: ComponentProps<"div"> & { variant?: "inline" | "card" }) {
  return <div data-tool-controls {...props} className={cn("relative z-20 flex min-h-11 shrink-0 items-center gap-1 px-1.5 py-1 select-none", variant === "card" ? "z-30 flex-wrap gap-2 rounded-xl border border-border-default bg-bg-primary px-2 shadow-sm" : "border-b border-border-default bg-bg-secondary", className)} />;
}
