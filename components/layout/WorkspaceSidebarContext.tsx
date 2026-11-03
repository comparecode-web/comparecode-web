"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface WorkspaceSidebarState {
  desktopExpanded: boolean | null;
  setDesktopExpanded: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  isFocusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarState>({ desktopExpanded: null, setDesktopExpanded: () => {}, mobileOpen: false, setMobileOpen: () => {}, isFocusMode: false, setFocusMode: () => {} });

export function WorkspaceSidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [desktopExpanded, setDesktopExpanded] = useState<boolean | null>(null);
  const [mobilePath, setMobilePath] = useState<string | null>(null);
  const mobileOpen = mobilePath === pathname;
  const setMobileOpen = useCallback((open: boolean) => setMobilePath(open ? pathname : null), [pathname]);
  const [focusModePath, setFocusModePath] = useState<string | null>(null);
  const isFocusMode = focusModePath === pathname;
  const setFocusMode = useCallback((value: boolean) => setFocusModePath(value ? pathname : null), [pathname]);

  if (mobilePath !== null && mobilePath !== pathname) setMobilePath(null);
  if (focusModePath !== null && focusModePath !== pathname) setFocusModePath(null);

  const value = useMemo(() => ({ desktopExpanded, setDesktopExpanded, mobileOpen, setMobileOpen, isFocusMode, setFocusMode }), [desktopExpanded, isFocusMode, mobileOpen, setFocusMode, setMobileOpen]);
  return <WorkspaceSidebarContext.Provider value={value}>{children}</WorkspaceSidebarContext.Provider>;
}

export function useWorkspaceSidebar() {
  return useContext(WorkspaceSidebarContext);
}
