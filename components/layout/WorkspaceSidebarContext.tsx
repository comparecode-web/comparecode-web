"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ComponentType, type ReactNode } from "react";

export interface WorkspaceSidebarRegistration {
  id: string;
  title: string;
  icon?: ComponentType<{ className?: string }>;
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface WorkspaceSidebarContextValue {
  sidebar: WorkspaceSidebarRegistration | null;
  registerSidebar: (registration: WorkspaceSidebarRegistration) => () => void;
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarContextValue>({
  sidebar: null,
  registerSidebar: () => () => {}
});

export function WorkspaceSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<WorkspaceSidebarRegistration | null>(null);

  const registerSidebar = useCallback((registration: WorkspaceSidebarRegistration) => {
    setSidebar(registration);

    return () => {
      setSidebar((current) => current?.id === registration.id ? null : current);
    };
  }, []);

  const value = useMemo(() => ({ sidebar, registerSidebar }), [registerSidebar, sidebar]);

  return (
    <WorkspaceSidebarContext.Provider value={value}>
      {children}
    </WorkspaceSidebarContext.Provider>
  );
}

export function useWorkspaceSidebar() {
  return useContext(WorkspaceSidebarContext);
}
