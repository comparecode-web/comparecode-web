"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface WorkspaceSidebarState {
  desktopExpanded: boolean | null;
  setDesktopExpanded: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarState>({ desktopExpanded: null, setDesktopExpanded: () => {}, mobileOpen: false, setMobileOpen: () => {} });

export function WorkspaceSidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [desktopExpanded, setDesktopExpanded] = useState<boolean | null>(null);
  const [mobilePath, setMobilePath] = useState<string | null>(null);
  const mobileOpen = mobilePath === pathname;
  const setMobileOpen = useCallback((open: boolean) => setMobilePath(open ? pathname : null), [pathname]);

  if (mobilePath !== null && mobilePath !== pathname) setMobilePath(null);

  const value = useMemo(() => ({ desktopExpanded, setDesktopExpanded, mobileOpen, setMobileOpen }), [desktopExpanded, mobileOpen, setMobileOpen]);
  return <WorkspaceSidebarContext.Provider value={value}>{children}</WorkspaceSidebarContext.Provider>;
}

export function useWorkspaceSidebar() {
  return useContext(WorkspaceSidebarContext);
}
