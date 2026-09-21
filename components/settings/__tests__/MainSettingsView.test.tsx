import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MainSettingsView } from "../MainSettingsView";
import { ThemeSelect } from "../ThemeSelect";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { defaultSettings } from "@/config/defaults";
import { AVAILABLE_THEMES } from "@/config/themes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsService } from "@/services/settingsService";
import { HistoryService } from "@/services/historyService";
import { TimeFormat } from "@/types/settings";

describe("Settings presentation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSettingsStore.setState({ settings: { ...defaultSettings }, isLoaded: true });
    vi.spyOn(SettingsService, "saveSettings").mockImplementation(() => {});
    vi.spyOn(HistoryService, "addSnapshotAsync").mockResolvedValue("unused");
  });

  it("shares all seven themes between the header control and Settings without resetting other settings", async () => {
    const user = userEvent.setup();
    useSettingsStore.setState({ settings: { ...defaultSettings, fontSize: 20 } });
    render(<><ThemeSelect /><MainSettingsView /></>);

    await user.click(screen.getAllByRole("button", { name: /^Theme:/ })[0]);
    expect(screen.getAllByRole("option")).toHaveLength(AVAILABLE_THEMES.length);
    await user.click(screen.getByRole("option", { name: "Nord" }));

    expect(screen.getAllByRole("button", { name: "Theme: Nord" })).toHaveLength(2);
    expect(useSettingsStore.getState().settings.fontSize).toBe(20);
  });

  it("keeps the preview passive and follows the shared custom color tokens and section resets", async () => {
    const user = userEvent.setup();
    useSettingsStore.setState({ settings: {
      ...defaultSettings,
      theme: "nord",
      useCustomHighlightColors: true,
      customDiffAddedBg: "#123456",
      customDiffAddedFg: "#234567",
      customDiffRemovedBg: "#345678",
      customDiffRemovedFg: "#456789",
      timeFormat: TimeFormat.TwelveHour,
      fontSize: 20
    } });
    render(<ThemeProvider><MainSettingsView /></ThemeProvider>);

    expect(screen.getByRole("figure")).toHaveTextContent("Hello CompareCode");
    expect(document.documentElement.style.getPropertyValue("--diff-added-bg")).toBe("#123456");
    expect(SettingsService.saveSettings).not.toHaveBeenCalled();
    expect(HistoryService.addSnapshotAsync).not.toHaveBeenCalled();

    act(() => useSettingsStore.getState().updateSettings({ customDiffAddedBg: "#abcdef" }));
    expect(document.documentElement.style.getPropertyValue("--diff-added-bg")).toBe("#abcdef");

    const reset = screen.getByRole("button", { name: "Restore Appearance defaults" });
    expect(reset).toHaveTextContent("");
    expect(screen.queryByText("Reset section")).not.toBeInTheDocument();
    await user.click(reset);
    expect(useSettingsStore.getState().settings).toMatchObject({
      theme: defaultSettings.theme,
      useCustomHighlightColors: defaultSettings.useCustomHighlightColors,
      timeFormat: TimeFormat.TwelveHour,
      fontSize: 20
    });
    expect(document.documentElement.style.getPropertyValue("--diff-added-bg")).toBe("");

    act(() => useSettingsStore.getState().updateSettings({ theme: "nord" }));
    await user.click(screen.getByRole("button", { name: "Restore Date & time defaults" }));
    expect(useSettingsStore.getState().settings).toMatchObject({
      theme: "nord", fontSize: 20, timeFormat: defaultSettings.timeFormat, dateFormat: defaultSettings.dateFormat
    });
    expect(HistoryService.addSnapshotAsync).not.toHaveBeenCalled();
  });
});
