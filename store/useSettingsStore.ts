import { create } from "zustand";
import { AppSettings } from "@/types/settings";
import { SettingsService } from "@/services/settingsService";
import { defaultSettings } from "@/config/defaults";

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
  resetSectionToDefaults: (keys: Array<keyof AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  loadSettings: () => {
    const loaded = SettingsService.loadSettings();
    set({ settings: loaded, isLoaded: true });
  },
  updateSettings: (newSettings: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    SettingsService.saveSettings(updated);
    set({ settings: updated, isLoaded: true });
  },
  resetToDefaults: () => {
    SettingsService.resetToDefaults();
    const loaded = SettingsService.loadSettings();
    set({ settings: loaded, isLoaded: true });
  },
  resetSectionToDefaults: (keys: Array<keyof AppSettings>) => {
    const current = get().settings;
    const updated = { ...current };
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      Reflect.set(updated, key, defaultSettings[key]);
    }
    SettingsService.saveSettings(updated);
    set({ settings: updated, isLoaded: true });
  }
}));