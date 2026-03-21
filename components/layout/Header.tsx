"use client";

import { MdDifference } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/uiHelpers";

export function Header() {
  const currentView = useAppStore((state) => state.currentView);
  const navigate = useAppStore((state) => state.navigate);

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-6 relative z-50">
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-3">
          <MdDifference className="text-2xl text-accent-primary" />
          <h1 className="text-lg font-bold text-text-primary">CompareCode</h1>
        </div>
        <nav className="flex items-center gap-2 h-full">
          <button
            onClick={() => navigate("editor")}
            className={cn(
              "relative flex h-full items-center px-4 text-sm font-semibold transition-colors duration-[var(--duration-medium)]",
              "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:origin-center after:bg-accent-primary after:transition-transform after:duration-[var(--duration-short)]",
              currentView === "editor"
                ? "text-accent-primary after:scale-x-100"
                : "text-text-secondary hover:text-accent-primary after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            Editor
          </button>
          <button
            onClick={() => navigate("history")}
            className={cn(
              "relative flex h-full items-center px-4 text-sm font-semibold transition-colors duration-[var(--duration-medium)]",
              "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:origin-center after:bg-accent-primary after:transition-transform after:duration-[var(--duration-short)]",
              currentView === "history"
                ? "text-accent-primary after:scale-x-100"
                : "text-text-secondary hover:text-accent-primary after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            History
          </button>
          <button
            onClick={() => navigate("settings")}
            className={cn(
              "relative flex h-full items-center px-4 text-sm font-semibold transition-colors duration-[var(--duration-medium)]",
              "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:origin-center after:bg-accent-primary after:transition-transform after:duration-[var(--duration-short)]",
              currentView === "settings"
                ? "text-accent-primary after:scale-x-100"
                : "text-text-secondary hover:text-accent-primary after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            Settings
          </button>
        </nav>
      </div>

      <div className="flex items-center h-full">
        <a
          href="https://github.com/comparecode-web/comparecode-web"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-text-secondary hover:text-accent-primary hover:bg-hover-overlay rounded transition-all duration-[var(--duration-medium)]"
        >
          <FaGithub className="text-xl" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}