"use client";

import { useMemo } from "react";
import { MdSettings } from "react-icons/md";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContent } from "@/components/layout/PageContent";
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
import { Button } from "@/components/ui/Button";
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
    <PageContent className="@container/settings">
        <PageHeader title="Settings" description="Make CompareCode your own. Changes are saved automatically." icon={MdSettings} />
        <div className="flex w-full flex-col gap-6">
          <OptionsSection density="comfortable" title="Appearance" description="Theme and text difference highlights." isDirty={isAppearanceSectionDirty} onReset={() => resetSectionToDefaults(APPEARANCE_SECTION_KEYS)}>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleResetCustomColorsToThemeDefaults}
                >
                  Reset theme defaults
                </Button>

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

          <OptionsSection density="comfortable" title="Date & time" description="Choose how dates and times appear across the application." isDirty={isDateTimeSectionDirty} onReset={() => resetSectionToDefaults(DATE_TIME_SECTION_KEYS)}>
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
      </PageContent>
  );
}
