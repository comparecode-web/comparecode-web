import type { ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";

export function PageContent({ children, className, contentClassName }: { children: ReactNode; className?: string; contentClassName?: string }) {
  return <div className={cn("h-full min-h-0 min-w-0 w-full overflow-y-auto bg-bg-secondary custom-scrollbar [scrollbar-gutter:stable]", className)}>
    <div data-page-content className={cn("mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-7", contentClassName)}>{children}</div>
  </div>;
}
