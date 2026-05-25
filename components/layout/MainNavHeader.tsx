"use client";

import Image from "next/image";
import { MdCode, MdHistory, MdSettings, MdImage } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/uiHelpers";

export function MainNavHeader() {
  const currentView = useAppStore((state) => state.currentView);
  const navigate = useAppStore((state) => state.navigate);

  const navItems = [
    { view: "text" as const, label: "Text", icon: MdCode },
    { view: "image" as const, label: "Image", icon: MdImage },
    { view: "history" as const, label: "History", icon: MdHistory },
    { view: "settings" as const, label: "Settings", icon: MdSettings }
  ];

  return (
    <header className="relative z-50 flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6">
      <div className="flex h-full items-center gap-3 sm:gap-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/brand/comparecode-logo.png"
            alt="CompareCode"
            width={42}
            height={42}
            className="rounded-sm"
            priority
          />
          <h1 className="text-sm font-bold text-text-primary sm:text-lg">CompareCode</h1>
        </div>
        <nav className="flex h-full items-center gap-1 sm:gap-2">
          {navItems.map(({ view, label, icon: Icon }) => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                onClick={() => navigate(view)}
                className={cn(
                  "relative z-10 flex items-center gap-2 overflow-hidden rounded-md px-3 py-1.5 text-sm font-semibold outline-none transition-colors duration-(--duration-medium)",
                  isActive ? "text-white" : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title={label}
              >
                <div
                  className={cn(
                    "absolute inset-0 -z-10 rounded-md bg-accent-primary transition-all duration-(--duration-medium) ease-out",
                    isActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
                  )}
                />
                <Icon className={cn("text-lg transition-colors duration-(--duration-medium)", isActive ? "text-white" : "text-text-secondary")} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex h-full items-center">
        <a
          href="https://github.com/comparecode-web/comparecode-web"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold text-text-secondary transition-all duration-(--duration-medium) hover:bg-hover-overlay hover:text-accent-primary sm:px-4"
          title="GitHub"
        >
          <FaGithub className="text-xl" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
