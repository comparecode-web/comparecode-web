import { AppSettings } from "@/types/settings";
import { defaultSettings } from "@/config/defaults";
import { STORAGE_KEYS } from "@/config/constants";

export class SettingsService {
  public static loadSettings(): AppSettings {
    if (typeof window === "undefined") {
      return defaultSettings;
    }

    try {
      const json = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (json) {
        const parsed = JSON.parse(json) as AppSettings;
        return { ...defaultSettings, ...parsed };
      }
    } catch {
    }

    return defaultSettings;
  }

  public static saveSettings(settings: AppSettings): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const json = JSON.stringify(settings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, json);
    } catch {
    }
  }

  public static resetToDefaults(): void {
    this.saveSettings(defaultSettings);
  }
}