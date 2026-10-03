import type { ComponentProps } from "react";
import { cn } from "@/utils/uiHelpers";

export function WorkspaceToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div data-tool-controls {...props} className={cn("relative z-20 flex min-h-11 shrink-0 items-center gap-1 border-b border-border-default bg-bg-secondary px-1.5 py-1 select-none", className)} />;
}
