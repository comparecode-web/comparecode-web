"use client";

import { MdMenu } from "react-icons/md";
import { useWorkspaceSidebar } from "./WorkspaceSidebarContext";

export function MainNavHeader() {
  const { mobileOpen, setMobileOpen } = useWorkspaceSidebar();
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border-default bg-bg-primary px-2 md:hidden">
      <button type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-text-secondary hover:bg-hover-overlay">
        <MdMenu className="text-xl" />Menu
      </button>
    </div>
  );
}
