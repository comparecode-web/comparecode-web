"use client";

import { useMemo } from "react";
import { MdSettings } from "react-icons/md";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getThemeHighlightDefaults } from "@/config/themes";
import { getThemeDefaultsAsCustomColors } from "@/utils/highlightColors";
import { type AppSettings, TimeFormat } from "@/types/settings";
import { Switch } from "@/components/ui/Switch";
import { ColorInput } from "@/components/ui/ColorInput";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { formatDateOnlyWithSettings } from "@/utils/formatters";
import { isSettingsSectionDirty } from "@/utils/settingsReset";
import { OptionsSection } from "./OptionsSection";
import { ThemeSelect } from "./ThemeSelect";
import { DiffColorPreview } from "./DiffColorPreview";

const DATE_FORMAT_PATTERNS = [
  "yyyy-MM-dd",
  "yyyy-MMM-dd",
  "dd-MM-yyyy",
  "MM-dd-yyyy",
  "dd-MMM-yyyy",
  "MMM-dd-yyyy"
] as const;

const APPEARANCE_SECTION_KEYS: Array<keyof AppSettings> = [
  "theme",
  "useCustomHighlightColors",
  "customDiffAddedBg",
  "customDiffAddedFg",
  "customDiffRemovedBg",
  "customDiffRemovedFg"
];
const DATE_TIME_SECTION_KEYS: Array<keyof AppSettings> = ["dateFormat", "timeFormat"];

function normalizeColorForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function MainSettingsView() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const themeHighlightDefaults = getThemeHighlightDefaults(settings.theme);
  const isAppearanceSectionDirty = isSettingsSectionDirty(settings, APPEARANCE_SECTION_KEYS);
  const isDateTimeSectionDirty = isSettingsSectionDirty(settings, DATE_TIME_SECTION_KEYS);
  const dateFormatOptions = useMemo(() => {
    const nowIso = new Date().toISOString();

    return DATE_FORMAT_PATTERNS.map((pattern) => ({
      value: pattern,
      label: `${formatDateOnlyWithSettings(nowIso, pattern)} (${pattern})`
    }));
  }, []);

  const handleResetCustomColorsToThemeDefaults = () => {
    updateSettings(getThemeDefaultsAsCustomColors(settings.theme));
  };

  return (
    <div className="@container/settings h-full min-w-0 w-full overflow-y-auto bg-bg-secondary custom-scrollbar">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdSettings className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Settings</h2>
        </div>
        <p className="mt-2 text-sm text-text-secondary">Make CompareCode your own. Changes are saved automatically.</p>
      </div>

      <div className="p-4 sm:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <OptionsSection title="Appearance" description="Theme and text difference highlights." isDirty={isAppearanceSectionDirty} onReset={() => resetSectionToDefaults(APPEARANCE_SECTION_KEYS)}>
            <div className="grid items-start gap-6 pt-4 @3xl/settings:grid-cols-2">
            <div className="@container/colors min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Theme</span>
              <ThemeSelect className="w-full sm:w-48" />
            </div>

            <div className="mt-2">
              <Switch
                checked={settings.useCustomHighlightColors}
                onChange={(e) => {
                  const isEnabled = e.target.checked;

                  if (!isEnabled) {
                    updateSettings({ useCustomHighlightColors: false });
                    return;
                  }

                  const defaults = getThemeDefaultsAsCustomColors(settings.theme);
                  const shouldHydrateFromThemeDefaults =
                    settings.customDiffAddedBg.trim() === "" ||
                    settings.customDiffAddedFg.trim() === "" ||
                    settings.customDiffRemovedBg.trim() === "" ||
                    settings.customDiffRemovedFg.trim() === "";

                  updateSettings({
                    useCustomHighlightColors: true,
                    ...(shouldHydrateFromThemeDefaults
                      ? defaults
                      : {})
                  });
                }}
                label="Custom highlight colors"
              />
            </div>

            {settings.useCustomHighlightColors && (
              <div className="mt-2 space-y-3">
                <button
                  type="button"
                  className="w-full sm:w-auto text-text-secondary hover:text-accent-primary transition-colors px-3 py-1.5 rounded border border-border-default hover:bg-hover-overlay text-sm font-medium"
                  onClick={handleResetCustomColorsToThemeDefaults}
                >
                  Reset theme defaults
                </button>

                <div className="grid grid-cols-1 gap-4 @min-[32rem]/colors:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <ColorInput
                      label="Original foreground"
                      value={settings.customDiffRemovedFg}
                      onChange={(value) => updateSettings({ customDiffRemovedFg: value })}
                      onRestoreDefault={() => updateSettings({ customDiffRemovedFg: themeHighlightDefaults.diffRemovedFg })}
                      isDifferentFromDefault={
                        normalizeColorForComparison(settings.customDiffRemovedFg) !==
                        normalizeColorForComparison(themeHighlightDefaults.diffRemovedFg)
                      }
                      placeholder="#fdb8c0 or rgba(...)"
                      pickerFallback="#fdb8c0"
                    />
                    <ColorInput
                      label="Original background"
                      value={settings.customDiffRemovedBg}
                      onChange={(value) => updateSettings({ customDiffRemovedBg: value })}
                      onRestoreDefault={() => updateSettings({ customDiffRemovedBg: themeHighlightDefaults.diffRemovedBg })}
                      isDifferentFromDefault={
                        normalizeColorForComparison(settings.customDiffRemovedBg) !==
                        normalizeColorForComparison(themeHighlightDefaults.diffRemovedBg)
                      }
                      placeholder="#ffeef0 or rgba(...)"
                      pickerFallback="#ffeef0"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <ColorInput
                      label="Modified foreground"
                      value={settings.customDiffAddedFg}
                      onChange={(value) => updateSettings({ customDiffAddedFg: value })}
                      onRestoreDefault={() => updateSettings({ customDiffAddedFg: themeHighlightDefaults.diffAddedFg })}
                      isDifferentFromDefault={
                        normalizeColorForComparison(settings.customDiffAddedFg) !==
                        normalizeColorForComparison(themeHighlightDefaults.diffAddedFg)
                      }
                      placeholder="#acf2bd or rgba(...)"
                      pickerFallback="#acf2bd"
                    />
                    <ColorInput
                      label="Modified background"
                      value={settings.customDiffAddedBg}
                      onChange={(value) => updateSettings({ customDiffAddedBg: value })}
                      onRestoreDefault={() => updateSettings({ customDiffAddedBg: themeHighlightDefaults.diffAddedBg })}
                      isDifferentFromDefault={
                        normalizeColorForComparison(settings.customDiffAddedBg) !==
                        normalizeColorForComparison(themeHighlightDefaults.diffAddedBg)
                      }
                      placeholder="#e6ffed or rgba(...)"
                      pickerFallback="#e6ffed"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
            <DiffColorPreview />
            </div>
          </OptionsSection>

          <OptionsSection title="Date & time" description="Choose how dates and times appear across the application." isDirty={isDateTimeSectionDirty} onReset={() => resetSectionToDefaults(DATE_TIME_SECTION_KEYS)}>
            <div className="grid gap-6 pt-4 @3xl/settings:grid-cols-2">

            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Date format</span>
              <SelectDropdown
                className="w-full"
                value={settings.dateFormat}
                onChange={(value) => updateSettings({ dateFormat: value })}
                options={dateFormatOptions}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Time format</span>
              <SelectDropdown
                className="w-full"
                value={settings.timeFormat}
                onChange={(value) => updateSettings({ timeFormat: value as TimeFormat })}
                options={[
                  { value: TimeFormat.TwentyFourHour, label: "24-hour (21:09)" },
                  { value: TimeFormat.TwelveHour, label: "12-hour (9:09 PM)" }
                ]}
              />
            </div>
            </div>
          </OptionsSection>
        </div>
      </div>

      <div className="p-4 text-center text-xs font-medium text-text-secondary shrink-0">
        Version 1.0.0
        <a href="/licenses/third-party.txt" target="_blank" rel="noopener noreferrer" className="mx-auto mt-2 block w-fit rounded text-accent-primary hover:underline focus-visible:outline-2 focus-visible:outline-accent-primary">Open-source licenses</a>
      </div>
    </div>
  );
}
