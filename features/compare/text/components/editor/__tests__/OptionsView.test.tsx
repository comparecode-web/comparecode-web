import { render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OptionsView, TextLayoutControl, TextPrecisionControl, TextTestButton } from "../OptionsView";
import { defaultSettings } from "@/config/defaults";
import { SettingsService } from "@/services/settingsService";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { useTextStore } from "@/features/compare/text/store/useTextStore";
import { originalTestText, modifiedTestText } from "@/utils/testData";
import { PrecisionLevel, ViewMode } from "@/types/settings";

const executeCompare = vi.hoisted(() => vi.fn());
vi.mock("@/features/compare/text/hooks/useTextCompareActions", () => ({
  useTextCompareActions: () => ({ executeCompare })
}));

function ControlsHarness() {
  const showTextTest = useTextUIStore((state) => state.showTextTest);
  const [expanded, setExpanded] = useState(false);
  return <>{showTextTest && <TextTestButton />}<button onClick={() => setExpanded(!expanded)}>Options</button>{expanded ? <OptionsView /> : <><TextPrecisionControl /><TextLayoutControl /></>}</>;
}

describe("Text options controls", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    executeCompare.mockClear();
    vi.spyOn(SettingsService, "saveSettings").mockImplementation(() => {});
    useSettingsStore.setState({ settings: { ...defaultSettings, fontSize: 20 }, isLoaded: true });
    useTextUIStore.setState({ showTextTest: useTextUIStore.getInitialState().showTextTest });
  });

  it("updates compact choices and preserves section reset boundaries", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);
    await user.click(screen.getByRole("radio", { name: "Character" }));
    await user.click(screen.getByRole("radio", { name: "Unified" }));
    expect(useSettingsStore.getState().settings).toMatchObject({ precision: PrecisionLevel.Character, viewMode: ViewMode.Unified });
    await user.click(screen.getByRole("button", { name: "Options" }));
    expect(screen.getAllByRole("radio", { name: "Character" })).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Character" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Restore Comparison defaults" }));
    expect(useSettingsStore.getState().settings).toMatchObject({ precision: defaultSettings.precision, viewMode: ViewMode.Unified, fontSize: 20 });
    await user.click(screen.getByRole("button", { name: "Restore Layout defaults" }));
    expect(screen.getByRole("radio", { name: "Split" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("button", { name: "Reset to defaults", exact: true })).not.toBeInTheDocument();
  });

  it("shows test text by default, supports hiding it and restores visibility with the section reset", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);
    await user.click(screen.getByRole("button", { name: "Test text" }));
    expect(useTextStore.getState()).toMatchObject({ leftText: originalTestText, rightText: modifiedTestText });
    expect(executeCompare).toHaveBeenCalledWith(useSettingsStore.getState().settings, true, false);
    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByLabelText("Show text test"));
    expect(screen.queryByRole("button", { name: "Test text" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore Button visibility defaults" }));
    expect(screen.getByRole("button", { name: "Test text" })).toBeVisible();
  });
});
