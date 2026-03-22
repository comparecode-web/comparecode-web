"use client";

import { MdSettings, MdExpandMore } from "react-icons/md";
import { useSettingsStore } from "@/store/useSettingsStore";
import { AVAILABLE_THEMES } from "@/config/themes";

export function MainSettingsView() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary">
      <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdSettings className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-primary p-3 sm:p-4 shadow-sm transition-all duration-[var(--duration-medium)] hover:border-accent-primary hover:shadow-md">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Appearance</h3>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Theme</span>
              <div className="relative flex items-center w-full sm:w-48">
                <select
                  value={settings.theme}
                  onChange={(e) => updateSettings({ theme: e.target.value })}
                  className="appearance-none w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-[var(--duration-short)]"
                >
                  {AVAILABLE_THEMES.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
                <MdExpandMore className="absolute right-2 text-xl text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-xs font-medium text-text-secondary shrink-0">
        Version 1.0.0
      </div>
    </div>
  );
}