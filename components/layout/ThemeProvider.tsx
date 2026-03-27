"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.settings.theme);

  useEffect(() => {
    const darkThemes = new Set(["dark", "dracula", "monokai", "solarized-dark", "nord"]);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = darkThemes.has(theme) ? "dark" : "light";
  }, [theme]);

  return <>{children}</>;
}