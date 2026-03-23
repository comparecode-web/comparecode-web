import { AppSettings } from "@/types/settings";
import { defaultSettings } from "@/config/defaults";
import { STORAGE_KEYS } from "@/config/constants";
import { StorageFactory } from "./storage/StorageFactory";

export class SettingsService {
  public static loadSettings(): AppSettings {
    const adapter = StorageFactory.getAdapter();
    const json = adapter.getItem(STORAGE_KEYS.SETTINGS);

    if (json) {
      try {
        const parsed = JSON.parse(json) as AppSettings;
        return { ...defaultSettings, ...parsed };
      } catch {
      }
    }

    return defaultSettings;
  }

  public static saveSettings(settings: AppSettings): void {
    const adapter = StorageFactory.getAdapter();

    try {
      const json = JSON.stringify(settings);
      adapter.setItem(STORAGE_KEYS.SETTINGS, json);
    } catch {
    }
  }

  public static resetToDefaults(): void {
    this.saveSettings(defaultSettings);
  }
}