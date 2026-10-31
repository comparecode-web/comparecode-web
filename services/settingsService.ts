import { AppSettings, IGNORE_RULE_LIMITS, IgnoreRule, TEXT_SYNTAX_LANGUAGES, UNCHANGED_CONTEXT_LINE_OPTIONS } from "@/types/settings";
import { defaultSettings } from "@/config/defaults";
import { STORAGE_KEYS } from "@/config/constants";
import { normalizeThemeId } from "@/config/themes";
import { StorageFactory } from "./storage/StorageFactory";

export class SettingsService {
  public static loadSettings(): AppSettings {
    const adapter = StorageFactory.getAdapter();
    const json = adapter.getItem(STORAGE_KEYS.SETTINGS);

    if (json) {
      try {
        const parsed = JSON.parse(json) as AppSettings;
        const merged = { ...defaultSettings, ...parsed };
        merged.theme = normalizeThemeId(merged.theme);
        merged.dateFormat = this.normalizeDateFormat(merged.dateFormat);
        merged.isSyntaxHighlightingEnabled = typeof merged.isSyntaxHighlightingEnabled === "boolean"
          ? merged.isSyntaxHighlightingEnabled : defaultSettings.isSyntaxHighlightingEnabled;
        merged.textSyntaxLanguage = TEXT_SYNTAX_LANGUAGES.includes(merged.textSyntaxLanguage)
          ? merged.textSyntaxLanguage : defaultSettings.textSyntaxLanguage;
        merged.ignoreCase = typeof merged.ignoreCase === "boolean" ? merged.ignoreCase : defaultSettings.ignoreCase;
        merged.ignoreRules = this.normalizeIgnoreRules(merged.ignoreRules);
        merged.isRealtimeCompareEnabled = typeof merged.isRealtimeCompareEnabled === "boolean"
          ? merged.isRealtimeCompareEnabled : defaultSettings.isRealtimeCompareEnabled;
        merged.isHideUnchangedEnabled = typeof merged.isHideUnchangedEnabled === "boolean"
          ? merged.isHideUnchangedEnabled : defaultSettings.isHideUnchangedEnabled;
        merged.unchangedContextLines = (UNCHANGED_CONTEXT_LINE_OPTIONS as ReadonlyArray<number>).includes(merged.unchangedContextLines)
          ? merged.unchangedContextLines : defaultSettings.unchangedContextLines;
        return merged;
      } catch {
      }
    }

    return defaultSettings;
  }

  private static normalizeIgnoreRules(value: unknown): IgnoreRule[] {
    if (!Array.isArray(value)) return [...defaultSettings.ignoreRules];
    const ids = new Set<string>();
    const rules: IgnoreRule[] = [];
    for (const item of value) {
      if (rules.length >= IGNORE_RULE_LIMITS.maxRules) break;
      if (!item || typeof item !== "object") continue;
      const { id, pattern, kind, isEnabled } = item as Record<string, unknown>;
      if (typeof id !== "string" || !id || ids.has(id) || typeof pattern !== "string" || pattern.length > IGNORE_RULE_LIMITS.maxPatternLength) continue;
      ids.add(id);
      rules.push({ id, pattern, kind: typeof kind === "string" && kind ? kind : "literal", isEnabled: typeof isEnabled === "boolean" ? isEnabled : true });
    }
    return rules;
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
