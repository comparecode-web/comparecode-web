"use client";

import Image from "next/image";
import { useEffect, useId, type ComponentType, type ReactNode } from "react";
import { MdClose } from "react-icons/md";
import { RiSideBarFill, RiSideBarLine } from "react-icons/ri";
import { IconButton } from "@/components/ui/IconButton";
import { useWorkspaceSidebar } from "@/components/layout/WorkspaceSidebarContext";
import { cn } from "@/utils/uiHelpers";

export interface ToolWorkspaceTab<T extends string> {
  value: T;
  title: string;
  icon: ComponentType<{ className?: string }>;
  content: ReactNode;
}

export interface ToolWorkspaceQuickAction {
  id: string;
  title: string;
  label?: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  ariaPressed?: boolean;
}

interface ToolWorkspaceShellProps<T extends string> {
  isPanelOpen: boolean;
  onPanelOpenChange: (isOpen: boolean) => void;
  activePanelTab: T;
  onPanelTabChange: (value: T) => void;
  tabs: Array<ToolWorkspaceTab<T>>;
  quickActions?: Array<ToolWorkspaceQuickAction>;
  toolTitle?: string;
  toolIcon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  contentClassName?: string;
}

function WorkspaceIconAction({ action, mobile = false }: { action: ToolWorkspaceQuickAction; mobile?: boolean }) {
  const Icon = action.icon;

  if (mobile) {
    return (
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.isDisabled}
        aria-pressed={action.ariaPressed}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-md border border-border-default bg-bg-primary px-3 text-left text-sm font-semibold text-text-primary transition-colors",
          "hover:bg-hover-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/45 disabled:cursor-not-allowed disabled:opacity-50",
          action.isActive && "border-accent-primary/50 bg-bg-selected text-accent-primary"
        )}
      >
        <Icon className="shrink-0 text-xl" />
        <span className="min-w-0 truncate">{action.label ?? action.title}</span>
      </button>
    );
  }

  return (
    <IconButton
      onClick={action.onClick}
      disabled={action.isDisabled}
      aria-label={action.title}
      aria-pressed={action.ariaPressed}
      data-tooltip={action.title}
      isActive={action.isActive}
      className={cn(
        "relative h-9 w-9 rounded-md px-0",
        action.isActive && "before:absolute before:left-0 before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:rounded-r before:bg-accent-primary"
      )}
    >
      <Icon className="text-xl" />
    </IconButton>
  );
}

export function ToolWorkspaceShell<T extends string>({
  isPanelOpen,
  onPanelOpenChange,
  activePanelTab,
  onPanelTabChange,
  tabs,
  quickActions = [],
  toolTitle = "Options",
  toolIcon: ToolIcon,
  children,
  contentClassName
}: ToolWorkspaceShellProps<T>) {
  const activeTab = tabs.find((tab) => tab.value === activePanelTab) ?? tabs[0];
  const sidebarId = useId();
  const { registerSidebar } = useWorkspaceSidebar();
  const SidebarIcon = isPanelOpen ? RiSideBarFill : RiSideBarLine;

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

  useEffect(() => {
    return registerSidebar({
      id: sidebarId,
      title: toolTitle,
      icon: ToolIcon,
      isOpen: isPanelOpen,
      toggleSidebar: () => onPanelOpenChange(!isPanelOpen)
    });
  }, [ToolIcon, isPanelOpen, onPanelOpenChange, registerSidebar, sidebarId, toolTitle]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onPanelOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPanelOpen, onPanelOpenChange]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full overflow-hidden bg-bg-primary">
      <div className="z-20 hidden w-12 shrink-0 flex-col items-center border-r border-border-default bg-bg-secondary px-1 py-2 sm:flex">
        <IconButton
          onClick={() => onPanelOpenChange(!isPanelOpen)}
          aria-label={isPanelOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isPanelOpen}
          data-tooltip={isPanelOpen ? "Close sidebar" : "Open sidebar"}
          isActive={isPanelOpen}
          className="h-9 w-9 rounded-md px-0"
        >
          <SidebarIcon className="text-xl" />
        </IconButton>
        {quickActions.length > 0 && <div className="my-1.5 h-px w-6 bg-border-default/70" />}
        <div className="flex flex-col items-center gap-1">
          {quickActions.map((action) => (
            <WorkspaceIconAction key={action.id} action={action} />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "z-10 hidden h-full shrink-0 overflow-hidden bg-bg-secondary transition-[width] duration-(--duration-medium) sm:block",
          isPanelOpen
            ? "w-[17.5rem] border-r border-border-default"
            : "w-0 border-r-0"
        )}
      >
        <div className="flex h-full w-[17.5rem] shrink-0 flex-col">
          <div className="flex h-(--header-height) shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-secondary px-3">
            <h2 className="min-w-0 truncate text-sm font-bold text-text-primary">{activeTab?.title}</h2>
            <div className="flex shrink-0 items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <IconButton
                    key={tab.value}
                    onClick={() => onPanelTabChange(tab.value)}
                    isActive={activePanelTab === tab.value}
                    aria-label={tab.title}
                    data-tooltip={tab.title}
                    size="sm"
                    className="rounded-md"
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
          className="fixed inset-0 z-50 bg-black/35 sm:hidden"
          onClick={() => onPanelOpenChange(false)}
        />
      )}

      <div
        aria-hidden={!isPanelOpen}
        inert={isPanelOpen ? undefined : true}
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,20rem)] flex-col overflow-hidden border-r border-border-default bg-bg-secondary shadow-xl transition-transform duration-(--duration-medium) sm:hidden",
          isPanelOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default px-3">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/comparecode-logo.png"
              alt="CompareCode"
              width={32}
              height={32}
              className="shrink-0 rounded-sm"
              priority
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-text-primary">CompareCode</div>
              <div className="truncate text-xs font-semibold text-text-secondary">{toolTitle}</div>
            </div>
          </div>
          <IconButton
            onClick={() => onPanelOpenChange(false)}
            aria-label="Close sidebar"
            data-tooltip="Close sidebar"
            size="sm"
            className="rounded-md"
          >
            <MdClose className="text-xl" />
          </IconButton>
        </div>
        {quickActions.length > 0 && (
          <div className="flex shrink-0 flex-col gap-2 border-b border-border-default p-2">
            {quickActions.map((action) => (
              <WorkspaceIconAction key={action.id} action={action} mobile />
            ))}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1 border-b border-border-default p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onPanelTabChange(tab.value)}
                className={cn(
                  "flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors",
                  activePanelTab === tab.value
                    ? "bg-bg-selected text-accent-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
              >
                <Icon className="shrink-0 text-lg" />
                <span className="min-w-0 truncate">{tab.title}</span>
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab?.content}
        </div>
      </div>

      <div className={cn("relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
