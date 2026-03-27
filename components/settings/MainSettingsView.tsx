"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MdSettings, MdExpandMore, MdRestartAlt } from "react-icons/md";
import { useSettingsStore } from "@/store/useSettingsStore";
import { AVAILABLE_THEMES, getThemeHighlightDefaults } from "@/config/themes";
import { getThemeDefaultsAsCustomColors } from "@/utils/highlightColors";
import { TimeFormat } from "@/types/settings";
import { Switch } from "@/components/ui/Switch";
import { ColorInput } from "@/components/ui/ColorInput";
import { formatDateOnlyWithSettings } from "@/utils/formatters";

const DATE_SEPARATORS = ["."];

const NUMERIC_DATE_TOKENS = ["yyyy", "MM", "dd"];
const TEXTUAL_LONG_DATE_TOKENS = ["yyyy", "MMMM", "dd"];
const TEXTUAL_SHORT_DATE_TOKENS = ["yyyy", "MMM", "dd"];
const TEXTUAL_MONTH_DAY_PATTERNS = ["MMMM d", "MMM d"];

function generatePermutations(tokens: Array<string>): Array<Array<string>> {
  if (tokens.length === 1) {
    return [tokens];
  }

  const permutations: Array<Array<string>> = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const remaining = [...tokens.slice(0, i), ...tokens.slice(i + 1)];
    const remainingPermutations = generatePermutations(remaining);

    for (let j = 0; j < remainingPermutations.length; j++) {
      permutations.push([current, ...remainingPermutations[j]]);
    }
  }

  return permutations;
}

function normalizeColorForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function MainSettingsView() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(false);
  const dateFormatDropdownRef = useRef<HTMLDivElement | null>(null);
  const themeHighlightDefaults = getThemeHighlightDefaults(settings.theme);
  const dateFormatOptions = useMemo(() => {
    const numericOrders = generatePermutations(NUMERIC_DATE_TOKENS);
    const numericPatterns: Array<string> = [];

    for (let i = 0; i < numericOrders.length; i++) {
      const order = numericOrders[i];
      for (let j = 0; j < DATE_SEPARATORS.length; j++) {
        numericPatterns.push(order.join(DATE_SEPARATORS[j]));
      }
    }

    const textualPatterns = [
      ...TEXTUAL_MONTH_DAY_PATTERNS,
      ...generatePermutations(TEXTUAL_LONG_DATE_TOKENS).map((pattern) => pattern.join(" ")),
      ...generatePermutations(TEXTUAL_SHORT_DATE_TOKENS).map((pattern) => pattern.join(" "))
    ];

    const patterns = Array.from(new Set([...textualPatterns, ...numericPatterns]));
    const nowIso = new Date().toISOString();

    return patterns.map((pattern) => ({
      value: pattern,
      label: formatDateOnlyWithSettings(nowIso, pattern)
    }));
  }, []);

  const selectedDateFormatLabel = useMemo(() => {
    const selected = dateFormatOptions.find((option) => option.value === settings.dateFormat);
    return selected?.label ?? settings.dateFormat;
  }, [dateFormatOptions, settings.dateFormat]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateFormatDropdownRef.current && !dateFormatDropdownRef.current.contains(target)) {
        setIsDateFormatOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDateFormatOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleThemeChange = (themeId: string) => {
    updateSettings({ theme: themeId });
  };

  const handleResetCustomColorsToThemeDefaults = () => {
    updateSettings(getThemeDefaultsAsCustomColors(settings.theme));
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary">
      <div className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdSettings className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-primary p-3 sm:p-4 shadow-sm transition-all duration-(--duration-medium) hover:border-accent-primary hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Appearance</h3>
              <button
                onClick={() => resetSectionToDefaults([
                  "theme",
                  "useCustomHighlightColors",
                  "customDiffAddedBg",
                  "customDiffAddedFg",
                  "customDiffRemovedBg",
                  "customDiffRemovedFg"
                ])}
                className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
                title="Restore section defaults"
              >
                <MdRestartAlt className="text-lg" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Theme</span>
              <div className="relative flex items-center w-full sm:w-48">
                <select
                  value={settings.theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="appearance-none w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-(--duration-short)"
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <ColorInput
                      label="Original Foreground"
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
                      label="Original Background"
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
                      label="Modified Foreground"
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
                      label="Modified Background"
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

          <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-primary p-3 sm:p-4 shadow-sm transition-all duration-(--duration-medium) hover:border-accent-primary hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Date & Time</h3>
              <button
                onClick={() => resetSectionToDefaults(["dateFormat", "timeFormat"])}
                className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
                title="Restore section defaults"
              >
                <MdRestartAlt className="text-lg" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Date Format</span>
              <div ref={dateFormatDropdownRef} className="relative w-full sm:w-48">
                <button
                  type="button"
                  onClick={() => setIsDateFormatOpen((previous) => !previous)}
                  className="w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm text-left outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-(--duration-short)"
                >
                  {selectedDateFormatLabel}
                </button>
                <MdExpandMore className="absolute right-2 top-1/2 -translate-y-1/2 text-xl text-text-secondary pointer-events-none" />
                {isDateFormatOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-border-default bg-bg-secondary shadow-lg max-h-56 overflow-y-auto custom-scrollbar">
                    {dateFormatOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateSettings({ dateFormat: option.value });
                          setIsDateFormatOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          option.value === settings.dateFormat
                            ? "bg-hover-overlay text-text-primary"
                            : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
              <span className="text-sm sm:text-base font-medium text-text-primary">Time Format</span>
              <div className="relative flex items-center w-full sm:w-48">
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value as TimeFormat })}
                  className="appearance-none w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-(--duration-short)"
                >
                  <option value={TimeFormat.TwentyFourHour}>24-hour (21:09)</option>
                  <option value={TimeFormat.TwelveHour}>12-hour (9:09 PM)</option>
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