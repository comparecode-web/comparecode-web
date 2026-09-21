"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface WorkspaceSidebarState {
  desktopExpanded: boolean | null;
  setDesktopExpanded: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarState>({ desktopExpanded: null, setDesktopExpanded: () => {}, mobileOpen: false, setMobileOpen: () => {} });

export function WorkspaceSidebarProvider({ children }: { children: ReactNode }) {
  const [desktopExpanded, setDesktopExpanded] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const value = useMemo(() => ({ desktopExpanded, setDesktopExpanded, mobileOpen, setMobileOpen }), [desktopExpanded, mobileOpen]);
  return <WorkspaceSidebarContext.Provider value={value}>{children}</WorkspaceSidebarContext.Provider>;
}

export function useWorkspaceSidebar() {
  return useContext(WorkspaceSidebarContext);
}
