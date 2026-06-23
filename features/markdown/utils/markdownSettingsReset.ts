import { defaultMarkdownUISettings, type MarkdownUISettingKey } from "@/features/markdown/store/useMarkdownUIStore";

export function isMarkdownSettingsSectionDirty(
  settings: Record<MarkdownUISettingKey, boolean | number | string>,
  keys: Array<MarkdownUISettingKey>
): boolean {
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!Object.is(settings[key], defaultMarkdownUISettings[key])) {
      return true;
    }
  }

  return false;
}
