"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdTune } from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/uiHelpers";

export interface ToolWorkspaceTab<T extends string> {
  value: T;
  title: string;
  icon: ComponentType<{ className?: string }>;
  content: ReactNode;
}

interface ToolWorkspaceShellProps<T extends string> {
  isPanelOpen: boolean;
  onPanelOpenChange: (isOpen: boolean) => void;
  activePanelTab: T;
  onPanelTabChange: (value: T) => void;
  tabs: Array<ToolWorkspaceTab<T>>;
  children: ReactNode;
  contentClassName?: string;
}

export function ToolWorkspaceShell<T extends string>({
  isPanelOpen,
  onPanelOpenChange,
  activePanelTab,
  onPanelTabChange,
  tabs,
  children,
  contentClassName
}: ToolWorkspaceShellProps<T>) {
  const activeTab = tabs.find((tab) => tab.value === activePanelTab) ?? tabs[0];

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const closePanelOnMobile = () => {
      if (mediaQuery.matches) {
        onPanelOpenChange(false);
      }
    };

    closePanelOnMobile();
    mediaQuery.addEventListener("change", closePanelOnMobile);

    return () => {
      mediaQuery.removeEventListener("change", closePanelOnMobile);
    };
  }, [onPanelOpenChange]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full overflow-hidden bg-bg-primary">
      <div
        className={cn(
          "z-10 h-full shrink-0 overflow-hidden bg-bg-secondary transition-[width] duration-(--duration-medium)",
          "max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-40 max-sm:h-full max-sm:shadow-lg max-sm:transition-transform",
          isPanelOpen
            ? "w-64 border-r border-border-default max-sm:translate-x-0"
            : "w-0 border-r-0 max-sm:-translate-x-full"
        )}
      >
        <div className="flex h-full w-64 shrink-0 flex-col">
          <div className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-secondary px-4">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <IconButton
                    key={tab.value}
                    onClick={() => onPanelTabChange(tab.value)}
                    isActive={activePanelTab === tab.value}
                    title={tab.title}
                    size="sm"
                  >
                    <Icon className="text-xl" />
                  </IconButton>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab?.content}
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          onClick={() => onPanelOpenChange(false)}
        />
      )}

      <div className="fixed bottom-3 right-2 z-40 flex flex-col gap-2 rounded-lg border border-border-default bg-bg-secondary/95 p-1 shadow-lg backdrop-blur-sm sm:hidden">
        <IconButton
          variant="primary"
          onClick={() => onPanelOpenChange(!isPanelOpen)}
          className="grid h-8 w-11 grid-cols-2 place-items-center px-0.5"
          title={isPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="shrink-0 text-xl" />
          {isPanelOpen ? <MdKeyboardArrowLeft className="shrink-0 text-2xl" /> : <MdKeyboardArrowRight className="shrink-0 text-2xl" />}
        </IconButton>
      </div>

      <div className="z-20 hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-border-default bg-bg-secondary px-1 py-2 sm:flex">
        <IconButton
          variant="primary"
          onClick={() => onPanelOpenChange(!isPanelOpen)}
          className="grid h-8 w-full grid-cols-2 place-items-center px-0.5"
          title={isPanelOpen ? "Close Options" : "Open Options"}
        >
          <MdTune className="shrink-0 text-xl" />
          {isPanelOpen ? <MdKeyboardArrowLeft className="shrink-0 text-2xl" /> : <MdKeyboardArrowRight className="shrink-0 text-2xl" />}
        </IconButton>
      </div>

      <div className={cn("relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
