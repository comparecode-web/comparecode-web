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
        const merged = { ...defaultSettings, ...parsed };
        merged.dateFormat = this.normalizeDateFormat(merged.dateFormat);
        return merged;
      } catch {
      }
    }

    return defaultSettings;
  }

  private static normalizeDateFormat(value: string | undefined): string {
    if (!value) {
      return defaultSettings.dateFormat;
    }

    const legacyMap: Record<string, string> = {
      MonthDay: "dd-MMM-yyyy",
      MonthDayShort: "dd-MMM-yyyy",
      MonthDayYear: "dd-MMM-yyyy",
      DayMonthYearText: "dd-MMM-yyyy",
      YyyyMmDd: "yyyy-MM-dd",
      YyyyDashMmDashDd: "yyyy-MM-dd",
      DdMmYyyy: "dd-MM-yyyy",
      DdSlashMmSlashYyyy: "dd-MM-yyyy",
      MmDdYyyy: "MM-dd-yyyy",
      MmSlashDdSlashYyyy: "MM-dd-yyyy",
      "MMMM d": "dd-MMM-yyyy",
      "MMM d": "dd-MMM-yyyy",
      "MMMM d, yyyy": "dd-MMM-yyyy",
      "MMM d, yyyy": "MMM-dd-yyyy",
      "d MMMM yyyy": "dd-MMM-yyyy",
      "yyyy.MM.dd": "yyyy-MM-dd",
      "dd.MM.yyyy": "dd-MM-yyyy",
      "MM.dd.yyyy": "MM-dd-yyyy",
      "dd/MM/yyyy": "dd-MM-yyyy",
      "MM/dd/yyyy": "MM-dd-yyyy"
    };

    const normalized = legacyMap[value] ?? value;
    const supported = new Set([
      "yyyy-MM-dd",
      "yyyy-MMM-dd",
      "dd-MM-yyyy",
      "MM-dd-yyyy",
      "dd-MMM-yyyy",
      "MMM-dd-yyyy"
    ]);

    return supported.has(normalized) ? normalized : defaultSettings.dateFormat;
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