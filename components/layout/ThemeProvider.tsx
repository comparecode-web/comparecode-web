"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getThemeHighlightDefaults } from "@/config/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const {
    theme,
    useCustomHighlightColors,
    customDiffAddedBg,
    customDiffAddedFg,
    customDiffRemovedBg,
    customDiffRemovedFg
  } = useSettingsStore((state) => state.settings);

  useEffect(() => {
    const darkThemes = new Set(["dark", "dracula", "monokai", "solarized-dark", "nord"]);
    const themeHighlightDefaults = getThemeHighlightDefaults(theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = darkThemes.has(theme) ? "dark" : "light";

    if (useCustomHighlightColors) {
      document.documentElement.style.setProperty(
        "--diff-added-bg",
        customDiffAddedBg.trim() || themeHighlightDefaults.diffAddedBg
      );
      document.documentElement.style.setProperty(
        "--diff-added-fg",
        customDiffAddedFg.trim() || themeHighlightDefaults.diffAddedFg
      );
      document.documentElement.style.setProperty(
        "--diff-removed-bg",
        customDiffRemovedBg.trim() || themeHighlightDefaults.diffRemovedBg
      );
      document.documentElement.style.setProperty(
        "--diff-removed-fg",
        customDiffRemovedFg.trim() || themeHighlightDefaults.diffRemovedFg
      );
      return;
    }

    document.documentElement.style.removeProperty("--diff-added-bg");
    document.documentElement.style.removeProperty("--diff-added-fg");
    document.documentElement.style.removeProperty("--diff-removed-bg");
    document.documentElement.style.removeProperty("--diff-removed-fg");
  }, [
    theme,
    useCustomHighlightColors,
    customDiffAddedBg,
    customDiffAddedFg,
    customDiffRemovedBg,
    customDiffRemovedFg
  ]);

  return <>{children}</>;
}