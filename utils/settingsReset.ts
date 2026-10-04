import { defaultSettings } from "@/config/defaults";
import { type AppSettings } from "@/types/settings";

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
