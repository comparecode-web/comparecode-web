import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsService } from "./settingsService";
import { StorageFactory } from "./storage/StorageFactory";
import { defaultSettings } from "@/config/defaults";
import { TEXT_SYNTAX_LANGUAGES } from "@/types/settings";

describe("syntax settings compatibility", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    getItem.mockReset();
    setItem.mockReset();
    vi.spyOn(StorageFactory, "getAdapter").mockReturnValue({ getItem, setItem, removeItem: vi.fn() });
  });

  it("fills missing fields in released settings without writing or changing valid preferences", () => {
    getItem.mockReturnValue(JSON.stringify({ theme: "dark", fontSize: 20, ignoreWhitespace: true, dateFormat: "YyyyMmDd" }));
    expect(SettingsService.loadSettings()).toMatchObject({
      theme: "dark", fontSize: 20, ignoreWhitespace: true, dateFormat: "yyyy-MM-dd",
      isSyntaxHighlightingEnabled: false, textSyntaxLanguage: "javascript"
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([undefined, null, "yes", 1, {}, []])("defaults a malformed toggle and unknown language while preserving unrelated settings: %j", (value) => {
    getItem.mockReturnValue(JSON.stringify({ theme: "nord", fontSize: 18, isSyntaxHighlightingEnabled: value, textSyntaxLanguage: "future-language" }));
    expect(SettingsService.loadSettings()).toMatchObject({ theme: "nord", fontSize: 18, isSyntaxHighlightingEnabled: false, textSyntaxLanguage: "javascript" });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each(TEXT_SYNTAX_LANGUAGES)("round trips current settings for %s", (language) => {
    getItem.mockReturnValue(JSON.stringify({ ...defaultSettings, isSyntaxHighlightingEnabled: true, textSyntaxLanguage: language }));
    const loaded = SettingsService.loadSettings();
    expect(loaded).toMatchObject({ isSyntaxHighlightingEnabled: true, textSyntaxLanguage: language });
    SettingsService.saveSettings(loaded);
    expect(JSON.parse(setItem.mock.calls[0][1])).toEqual(loaded);
  });

  it.each([null, "{broken"])("keeps fresh or unreadable settings safe: %s", (json) => {
    getItem.mockReturnValue(json);
    expect(SettingsService.loadSettings()).toEqual(defaultSettings);
    expect(setItem).not.toHaveBeenCalled();
  });
});
