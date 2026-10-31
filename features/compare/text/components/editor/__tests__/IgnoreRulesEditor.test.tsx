import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { IgnoreRulesEditor, IgnoreRulesIndicator } from "../IgnoreRulesEditor";
import { OptionsView } from "../OptionsView";
import { defaultSettings } from "@/config/defaults";
import { SettingsService } from "@/services/settingsService";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { IGNORE_RULE_LIMITS } from "@/types/settings";

vi.mock("@/features/compare/text/hooks/useTextCompareActions", () => ({ useTextCompareActions: () => ({ executeCompare: vi.fn() }) }));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(SettingsService, "saveSettings").mockImplementation(() => {});
  useSettingsStore.setState({ settings: { ...defaultSettings, ignoreRules: [] }, isLoaded: true });
  useTextUIStore.setState({ isOptionsPanelOpen: false, optionsPanelTab: "history" });
});

it("adds, edits with a short delay, disables, and removes rules", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<IgnoreRulesEditor />);
  await user.click(screen.getByRole("button", { name: "Add rule" }));
  await user.type(screen.getByRole("textbox", { name: "Ignore rule 1" }), "ts=2026");
  expect(useSettingsStore.getState().settings.ignoreRules[0].pattern).toBe("");
  await act(async () => { vi.advanceTimersByTime(400); });
  expect(useSettingsStore.getState().settings.ignoreRules[0]).toMatchObject({ pattern: "ts=2026", kind: "literal", isEnabled: true });
  await user.click(screen.getByRole("checkbox", { name: "Use rule 1" }));
  expect(useSettingsStore.getState().settings.ignoreRules[0].isEnabled).toBe(false);
  await user.click(screen.getByRole("button", { name: "Remove rule 1" }));
  expect(useSettingsStore.getState().settings.ignoreRules).toEqual([]);
  vi.useRealTimers();
});

it("keeps rules when the Comparison section is reset and clears them only on request", async () => {
  const user = userEvent.setup();
  useSettingsStore.setState({ settings: { ...defaultSettings, ignoreCase: true, ignoreRules: [{ id: "a", pattern: "x", kind: "literal", isEnabled: true }] }, isLoaded: true });
  render(<OptionsView />);
  await user.click(screen.getByRole("button", { name: "Restore Comparison defaults" }));
  expect(useSettingsStore.getState().settings).toMatchObject({ ignoreCase: false, ignoreRules: [{ id: "a", pattern: "x" }] });
  await user.click(screen.getByRole("button", { name: "Clear rules" }));
  expect(useSettingsStore.getState().settings.ignoreRules).toEqual([]);
});

it("limits the number of rules", () => {
  const rules = Array.from({ length: IGNORE_RULE_LIMITS.maxRules }, (_, index) => ({ id: `${index}`, pattern: `${index}`, kind: "literal", isEnabled: true }));
  useSettingsStore.setState({ settings: { ...defaultSettings, ignoreRules: rules }, isLoaded: true });
  render(<IgnoreRulesEditor />);
  expect(screen.getByRole("button", { name: "Add rule" })).toBeDisabled();
});

it("shows active rules and opens Options from the indicator", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<IgnoreRulesIndicator />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  useSettingsStore.setState({ settings: { ...defaultSettings, ignoreRules: [
    { id: "a", pattern: "x", kind: "literal", isEnabled: true },
    { id: "b", pattern: "", kind: "literal", isEnabled: true },
    { id: "c", pattern: "y", kind: "literal", isEnabled: false }
  ] }, isLoaded: true });
  rerender(<IgnoreRulesIndicator />);
  await user.click(screen.getByRole("button", { name: "1 ignore rule" }));
  expect(useTextUIStore.getState()).toMatchObject({ isOptionsPanelOpen: true, optionsPanelTab: "options" });
});

it("saves a pending rule edit when the editor closes before the delay ends", async () => {
  const user = userEvent.setup();
  useSettingsStore.setState({ settings: { ...defaultSettings, ignoreRules: [{ id: "a", pattern: "", kind: "literal", isEnabled: true }] }, isLoaded: true });
  const { unmount } = render(<IgnoreRulesEditor />);
  await user.type(screen.getByRole("textbox", { name: "Ignore rule 1" }), "build-");
  unmount();
  expect(useSettingsStore.getState().settings.ignoreRules[0].pattern).toBe("build-");
});
