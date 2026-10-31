import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsService } from "./settingsService";
import { StorageFactory } from "./storage/StorageFactory";
import { defaultSettings } from "@/config/defaults";
import { TEXT_SYNTAX_LANGUAGES, UNCHANGED_CONTEXT_LINE_OPTIONS } from "@/types/settings";

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

describe("hide unchanged settings compatibility", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    getItem.mockReset();
    setItem.mockReset();
    vi.spyOn(StorageFactory, "getAdapter").mockReturnValue({ getItem, setItem, removeItem: vi.fn() });
  });

  it("defaults the new fields for released settings without writing", () => {
    getItem.mockReturnValue(JSON.stringify({ theme: "dark", viewMode: "Unified" }));
    expect(SettingsService.loadSettings()).toMatchObject({ theme: "dark", viewMode: "Unified", isHideUnchangedEnabled: false, unchangedContextLines: 3 });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([[undefined, 7], ["yes", -1], [1, 3.5], [null, "5"], [{}, null]])("defaults malformed values independently: %j and %j", (enabled, context) => {
    getItem.mockReturnValue(JSON.stringify({ fontSize: 18, isHideUnchangedEnabled: enabled, unchangedContextLines: context }));
    expect(SettingsService.loadSettings()).toMatchObject({ fontSize: 18, isHideUnchangedEnabled: false, unchangedContextLines: 3 });
  });

  it.each(UNCHANGED_CONTEXT_LINE_OPTIONS)("keeps a valid context of %i lines", (context) => {
    getItem.mockReturnValue(JSON.stringify({ isHideUnchangedEnabled: true, unchangedContextLines: context }));
    expect(SettingsService.loadSettings()).toMatchObject({ isHideUnchangedEnabled: true, unchangedContextLines: context });
  });
});

describe("ignore settings compatibility", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    getItem.mockReset();
    setItem.mockReset();
    vi.spyOn(StorageFactory, "getAdapter").mockReturnValue({ getItem, setItem, removeItem: vi.fn() });
  });

  it("defaults ignore case and rules for released settings", () => {
    getItem.mockReturnValue(JSON.stringify({ ignoreWhitespace: true }));
    expect(SettingsService.loadSettings()).toMatchObject({ ignoreWhitespace: true, ignoreCase: false, ignoreRules: [] });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([null, "rules", 4, {}])("defaults malformed rule lists: %j", (ignoreRules) => {
    getItem.mockReturnValue(JSON.stringify({ ignoreRules, ignoreCase: "yes", fontSize: 18 }));
    expect(SettingsService.loadSettings()).toMatchObject({ ignoreRules: [], ignoreCase: false, fontSize: 18 });
  });

  it("keeps valid rules, drops invalid or duplicate ones, and preserves unknown kinds", () => {
    getItem.mockReturnValue(JSON.stringify({ ignoreRules: [
      { id: "a", pattern: "ts=", kind: "literal", isEnabled: false },
      { id: "b", pattern: "x" },
      { id: "a", pattern: "duplicate" },
      { id: "c", pattern: 3 },
      { pattern: "missing id" },
      null,
      { id: "d", pattern: "x".repeat(501) },
      { id: "e", pattern: "\d+", kind: "regex", isEnabled: true }
    ] }));
    expect(SettingsService.loadSettings().ignoreRules).toEqual([
      { id: "a", pattern: "ts=", kind: "literal", isEnabled: false },
      { id: "b", pattern: "x", kind: "literal", isEnabled: true },
      { id: "e", pattern: "\d+", kind: "regex", isEnabled: true }
    ]);
  });

  it.each([[undefined, false], ["no", false], [false, false], [true, true]])("validates the live input editor %j as %j", (value, expected) => {
    getItem.mockReturnValue(JSON.stringify({ isRealtimeCompareEnabled: value }));
    expect(SettingsService.loadSettings().isRealtimeCompareEnabled).toBe(expected);
  });

  it("limits the number of loaded rules", () => {
    getItem.mockReturnValue(JSON.stringify({ ignoreRules: Array.from({ length: 80 }, (_, index) => ({ id: `${index}`, pattern: "x" })) }));
    expect(SettingsService.loadSettings().ignoreRules).toHaveLength(50);
  });
});
