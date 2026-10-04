"use client";

import { MdMenu } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { useWorkspaceSidebar } from "./WorkspaceSidebarContext";

export function MainNavHeader() {
  const { mobileOpen, setMobileOpen } = useWorkspaceSidebar();
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border-default bg-bg-primary px-2 md:hidden">
      <Button variant="ghost" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
        <MdMenu className="text-xl" />Menu
      </Button>
    </div>
  );
}
