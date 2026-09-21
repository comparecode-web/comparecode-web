"use client";

import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { AVAILABLE_THEMES } from "@/config/themes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { MdPalette } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";

const themeOptions = AVAILABLE_THEMES.map((theme) => ({ value: theme.id, label: theme.name }));

export function ThemeSelect({ className, sidebar = false }: { className?: string; sidebar?: boolean }) {
  const theme = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  return (
    <div className={cn("relative", className)}>
      <SelectDropdown
        label="Theme"
        value={theme}
        onChange={(value) => updateSettings({ theme: value })}
        options={themeOptions}
        className={sidebar ? "@max-[12rem]/navigation:[&>svg]:hidden" : undefined}
        triggerClassName={sidebar ? "h-11 transition-[background-color,border-color,box-shadow] @max-[12rem]/navigation:p-0 @max-[12rem]/navigation:text-transparent @max-[12rem]/navigation:overflow-hidden @max-[12rem]/navigation:whitespace-nowrap" : undefined}
        menuClassName="min-w-44"
      />
      {sidebar && <MdPalette className="pointer-events-none absolute left-3 top-3 text-xl text-text-secondary @min-[12rem]/navigation:hidden" />}
    </div>
  );
}
