import { create } from "zustand";
import { AppSettings } from "@/types/settings";
import { SettingsService } from "@/services/settingsService";
import { defaultSettings } from "@/config/defaults";

interface SettingsState {
  settings: AppSettings;
  loadSettings: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loadSettings: () => {
    const loaded = SettingsService.loadSettings();
    set({ settings: loaded });
  },
  updateSettings: (newSettings: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    SettingsService.saveSettings(updated);
    set({ settings: updated });
  },
  resetToDefaults: () => {
    SettingsService.resetToDefaults();
    const loaded = SettingsService.loadSettings();
    set({ settings: loaded });
  }
}));