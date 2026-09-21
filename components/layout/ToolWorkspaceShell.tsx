"use client";

import { useEffect, useId, useRef, type ComponentType, type ReactNode } from "react";
import { MdClose, MdExpandLess, MdExpandMore } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/uiHelpers";
import { WORKSPACE_MEDIA } from "@/config/responsive";

export interface ToolWorkspaceTab<T extends string> {
  value: T;
  title: string;
  shortTitle?: string;
  icon: ComponentType<{ className?: string }>;
  content: ReactNode;
  placement?: "top" | "right";
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
  compactControls?: ReactNode;
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
  contentClassName,
  compactControls
}: ToolWorkspaceShellProps<T>) {
  const activeTab = tabs.find((tab) => tab.value === activePanelTab) ?? tabs[0];
  const panelId = useId();
  const controlsRef = useRef<HTMLDivElement>(null);
  const historyTriggerRef = useRef<HTMLButtonElement>(null);
  const historyPanelId = useId();
  const historyTab = tabs.find((tab) => tab.placement === "right");
  const isHistoryOpen = isPanelOpen && activeTab?.placement === "right";
  const isOptionsOpen = isPanelOpen && !isHistoryOpen;
  const optionsTab = tabs.find((tab) => tab.placement !== "right");

  useEffect(() => {
    if (!isHistoryOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      onPanelOpenChange(false);
      historyTriggerRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isHistoryOpen, onPanelOpenChange]);

  useEffect(() => {
    const query = window.matchMedia?.(WORKSPACE_MEDIA.belowSmall);
    if (!query) return;
    const closeOnMobile = () => {
      if (query.matches) onPanelOpenChange(false);
    };
    closeOnMobile();
    query.addEventListener("change", closeOnMobile);
    return () => query.removeEventListener("change", closeOnMobile);
  }, [onPanelOpenChange]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full overflow-hidden bg-bg-secondary">
    <div className="@container/workspace flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-2">
      <div
        ref={controlsRef}
        data-tool-controls
        className="relative z-30 flex max-h-[40%] shrink-0 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-sm"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented && isPanelOpen) {
            event.stopPropagation();
            onPanelOpenChange(false);
            if (isHistoryOpen) historyTriggerRef.current?.focus();
            else controlsRef.current?.querySelector<HTMLButtonElement>("[data-panel-toggle]")?.focus();
          }
        }}
      >
        <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 px-2 py-1">
          {compactControls}
          <div className={cn("mr-auto hidden items-center gap-2 text-sm font-semibold text-text-secondary", !compactControls && "@lg/workspace:flex")}>
            {ToolIcon && <ToolIcon className="text-lg" />}
            <span>{toolTitle}</span>
          </div>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                title={action.title}
                aria-label={action.title}
                aria-pressed={action.ariaPressed}
                disabled={action.isDisabled}
                onClick={action.onClick}
                leftIcon={<Icon className="text-lg" />}
                className={cn("px-2", action.isActive && "border-accent-primary/40 text-accent-primary")}
              >
                <span className="hidden @lg/workspace:inline">{action.label ?? action.title}</span>
              </Button>
            );
          })}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {tabs.filter((tab) => tab.placement !== "right").map((tab) => {
            const Icon = tab.icon;
            const selected = isPanelOpen && activePanelTab === tab.value;
            return (
              <Button
                key={tab.value}
                data-panel-toggle
                size="sm"
                variant="primary"
                className="px-2"
                aria-expanded={selected}
                aria-label={tab.title}
                aria-controls={panelId}
                onClick={() => {
                  onPanelTabChange(tab.value);
                  onPanelOpenChange(!selected);
                }}
                leftIcon={<Icon className="text-lg" />}
              >
                {tab.shortTitle ? <><span className="@lg/workspace:hidden">{tab.shortTitle}</span><span className="hidden @lg/workspace:inline">{tab.title}</span></> : tab.title}
                {selected ? <MdExpandLess /> : <MdExpandMore />}
              </Button>
            );
          })}
          {historyTab && (
            <Button
              ref={historyTriggerRef}
              size="sm"
              variant={isHistoryOpen ? "primary" : "outline"}
              className="shrink-0 px-2"
              title={historyTab.title}
              aria-label={historyTab.title}
              aria-expanded={isHistoryOpen}
              aria-controls={historyPanelId}
              onClick={() => { onPanelTabChange(historyTab.value); onPanelOpenChange(!isHistoryOpen); }}
            >
              <historyTab.icon className="text-lg" />
            </Button>
          )}
          </div>
        </div>
        <div
          id={panelId}
          aria-hidden={!isOptionsOpen}
          inert={!isOptionsOpen}
          className={cn("grid min-h-0 transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none", isOptionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        >
          <div data-open={isOptionsOpen} className="cc-options-scroll min-h-0 custom-scrollbar">
            <div className="border-t border-border-default">{optionsTab?.content}</div>
          </div>
        </div>
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 gap-1">
        <div className={cn("relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-sm", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
      {historyTab && <aside
        id={historyPanelId}
        aria-label={historyTab.title}
        aria-hidden={!isHistoryOpen}
        inert={!isHistoryOpen}
        data-tool-controls
        className={cn("absolute inset-y-0 right-0 z-40 shrink-0 overflow-hidden bg-bg-primary transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:relative md:inset-auto", isHistoryOpen ? "w-[min(90vw,20rem)] shadow-xl md:shadow-none" : "w-0")}
      >
        <div className="flex h-full min-h-0 w-[min(90vw,20rem)] flex-col border-l border-border-default">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default p-3">
            <h2 className="font-semibold">{historyTab.title}</h2>
            <Button size="sm" variant="outline" aria-label="Close history" onClick={() => { onPanelOpenChange(false); historyTriggerRef.current?.focus(); }}><MdClose className="text-lg" /></Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{historyTab.content}</div>
        </div>
      </aside>}
    </div>
  );
}
