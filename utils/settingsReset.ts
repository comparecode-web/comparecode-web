import { defaultSettings } from "@/config/defaults";
import { type AppSettings } from "@/types/settings";
import { cn } from "@/utils/uiHelpers";

export function isSettingsSectionDirty(
  settings: AppSettings,
  keys: Array<keyof AppSettings>
): boolean {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!Object.is(settings[key], defaultSettings[key])) {
      return true;
    }
  }

  return false;
}

export function getSectionResetButtonClass(isDirty: boolean): string {
  return cn(
    "transition-colors p-1 rounded border",
    isDirty
      ? "border-accent-primary/60 bg-accent-primary/10 text-accent-primary hover:border-accent-primary hover:text-accent-hover"
      : "border-transparent text-text-secondary hover:border-border-default hover:bg-hover-overlay hover:text-accent-primary"
  );
}