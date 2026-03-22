"use client";

import { MdDifference, MdCode, MdHistory, MdSettings } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/uiHelpers";

export function Header() {
  const currentView = useAppStore((state) => state.currentView);
  const navigate = useAppStore((state) => state.navigate);

  const navItems = [
    { view: "editor" as const, label: "Editor", icon: MdCode },
    { view: "history" as const, label: "History", icon: MdHistory },
    { view: "settings" as const, label: "Settings", icon: MdSettings },
  ];

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6 relative z-50">
      <div className="flex items-center gap-3 sm:gap-8 h-full">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdDifference className="text-xl sm:text-2xl text-accent-primary" />
          <h1 className="text-sm sm:text-lg font-bold text-text-primary">CompareCode</h1>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2 h-full">
          {navItems.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => navigate(view)}
              className={cn(
                "relative flex h-full items-center px-2 sm:px-4 text-sm font-semibold transition-colors duration-[var(--duration-medium)]",
                "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:origin-center after:bg-accent-primary after:transition-transform after:duration-[var(--duration-short)]",
                currentView === view
                  ? "text-accent-primary after:scale-x-100"
                  : "text-text-secondary hover:text-accent-primary after:scale-x-0 hover:after:scale-x-100"
              )}
              title={label}
            >
              {currentView === view ? (
                <span>{label}</span>
              ) : (
                <>
                  <Icon className="text-lg sm:hidden" />
                  <span className="hidden sm:inline">{label}</span>
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center h-full">
        <a
          href="https://github.com/comparecode-web/comparecode-web"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2 sm:px-4 py-1.5 text-sm font-semibold text-text-secondary hover:text-accent-primary hover:bg-hover-overlay rounded transition-all duration-[var(--duration-medium)]"
          title="GitHub"
        >
          <FaGithub className="text-xl" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}