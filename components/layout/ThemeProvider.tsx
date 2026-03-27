"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getThemeHighlightDefaults } from "@/config/themes";
import { resolveCustomHighlightColors } from "@/utils/highlightColors";

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
      const resolvedCustomColors = resolveCustomHighlightColors(
        {
          customDiffAddedBg,
          customDiffAddedFg,
          customDiffRemovedBg,
          customDiffRemovedFg
        },
        themeHighlightDefaults
      );

      document.documentElement.style.setProperty(
        "--diff-added-bg",
        resolvedCustomColors.diffAddedBg
      );
      document.documentElement.style.setProperty(
        "--diff-added-fg",
        resolvedCustomColors.diffAddedFg
      );
      document.documentElement.style.setProperty(
        "--diff-removed-bg",
        resolvedCustomColors.diffRemovedBg
      );
      document.documentElement.style.setProperty(
        "--diff-removed-fg",
        resolvedCustomColors.diffRemovedFg
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