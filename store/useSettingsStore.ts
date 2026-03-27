import { create } from "zustand";
import { AppSettings } from "@/types/settings";
import { SettingsService } from "@/services/settingsService";
import { defaultSettings } from "@/config/defaults";

interface SettingsState {
  settings: AppSettings;
  loadSettings: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
  resetSectionToDefaults: (keys: Array<keyof AppSettings>) => void;
}

function getInitialSettings(): AppSettings {
  return SettingsService.loadSettings();
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: getInitialSettings(),
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
  },
  resetSectionToDefaults: (keys: Array<keyof AppSettings>) => {
    const current = get().settings;
    const updated = { ...current };
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      Reflect.set(updated, key, defaultSettings[key]);
    }
    SettingsService.saveSettings(updated);
    set({ settings: updated });
  }
}));