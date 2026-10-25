import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsProvider } from "@/components/layout/SettingsProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { STORAGE_KEYS } from "@/config/constants";
import { defaultSettings } from "@/config/defaults";
import { buildThemeInitScript } from "@/config/themes";
import { useSettingsStore } from "@/store/useSettingsStore";

const originalSettingsState = useSettingsStore.getState();

function resetSettingsStore() {
  useSettingsStore.setState({
    settings: defaultSettings,
    isLoaded: false,
    loadSettings: vi.fn(() => {
      useSettingsStore.setState({
        settings: defaultSettings,
        isLoaded: true
      });
    })
  });
}

function restoreSettingsStore() {
  useSettingsStore.setState({
    settings: defaultSettings,
    isLoaded: false,
    loadSettings: originalSettingsState.loadSettings,
    updateSettings: originalSettingsState.updateSettings,
    resetToDefaults: originalSettingsState.resetToDefaults,
    resetSectionToDefaults: originalSettingsState.resetSectionToDefaults
  });
}

describe("SettingsProvider", () => {
  beforeEach(() => {
    resetSettingsStore();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    window.localStorage.clear();
  });

  afterEach(() => {
    restoreSettingsStore();
  });

  it("keeps children visible while settings load", async () => {
    render(
      <SettingsProvider>
        <div>Application content</div>
      </SettingsProvider>
    );

    expect(screen.getByText("Application content")).toBeInTheDocument();

    await waitFor(() => {
      expect(useSettingsStore.getState().loadSettings).toHaveBeenCalledTimes(1);
    });
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    resetSettingsStore();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    window.localStorage.clear();
  });

  afterEach(() => {
    restoreSettingsStore();
  });

  it("does not overwrite the initial document theme before settings are loaded", async () => {
    document.documentElement.setAttribute("data-theme", "dracula");
    document.documentElement.style.colorScheme = "dark";

    render(
      <ThemeProvider>
        <div>Theme content</div>
      </ThemeProvider>
    );

    expect(screen.getByText("Theme content")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-theme", "dracula");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    act(() => {
      useSettingsStore.setState({
        settings: {
          ...defaultSettings,
          theme: "light"
        },
        isLoaded: true
      });
    });

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
    });
  });

  it("keeps a stored retired Monokai theme on Dark after real settings load", async () => {
    window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...defaultSettings, theme: "monokai" }));
    useSettingsStore.setState({ loadSettings: originalSettingsState.loadSettings });
    new Function(buildThemeInitScript())();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    render(
      <SettingsProvider>
        <ThemeProvider>
          <div>Theme content</div>
        </ThemeProvider>
      </SettingsProvider>
    );

    await waitFor(() => expect(useSettingsStore.getState().settings.theme).toBe("dark"));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.SETTINGS)!).theme).toBe("monokai");
  });
});
