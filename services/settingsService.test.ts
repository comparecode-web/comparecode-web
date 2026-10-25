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

  it("maps the retired Monokai theme to Dark without writing or touching custom colors", () => {
    const stored = { theme: "monokai", fontSize: 18, useCustomHighlightColors: true, customDiffAddedBg: "#112233", customDiffRemovedFg: "rgba(1, 2, 3, 0.5)" };
    getItem.mockReturnValue(JSON.stringify(stored));
    expect(SettingsService.loadSettings()).toMatchObject({ ...stored, theme: "dark" });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([["unknown-theme"], [""], [42], [null], [{}]])("falls back to the default theme for %j while preserving other settings", (theme) => {
    getItem.mockReturnValue(JSON.stringify({ theme, fontSize: 18 }));
    expect(SettingsService.loadSettings()).toMatchObject({ theme: defaultSettings.theme, fontSize: 18 });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each(["light", "solarized-light", "sand", "bubblegum", "dark", "dracula", "nord", "solarized-dark", "space", "forest"])("keeps the current %s theme", (theme) => {
    getItem.mockReturnValue(JSON.stringify({ theme }));
    expect(SettingsService.loadSettings().theme).toBe(theme);
  });

  it.each([null, "{broken"])("keeps fresh or unreadable settings safe: %s", (json) => {
    getItem.mockReturnValue(json);
    expect(SettingsService.loadSettings()).toEqual(defaultSettings);
    expect(setItem).not.toHaveBeenCalled();
  });
});
