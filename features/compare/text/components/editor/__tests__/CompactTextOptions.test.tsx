import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CompactTextOptions } from "../CompactTextOptions";
import { useSettingsStore } from "@/store/useSettingsStore";
import { defaultSettings } from "@/config/defaults";
import { SettingsService } from "@/services/settingsService";
import { PrecisionLevel } from "@/types/settings";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("fits complete settings in priority order and preserves values when resizing", async () => {
  let width = 1000;
  let resize = () => {};
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 180 } as DOMRect);
  vi.spyOn(SettingsService, "saveSettings").mockImplementation(() => {});
  useSettingsStore.setState({ settings: { ...defaultSettings }, isLoaded: true });
  const user = userEvent.setup();
  const { container } = render(<CompactTextOptions />);
  expect(screen.getByRole("button", { name: /Font family:/ })).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "Character" }));

  act(() => { width = 370; resize(); });
  expect(screen.getByRole("radio", { name: "Unified" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Font family:/ })).not.toBeInTheDocument();
  expect(container.querySelectorAll("[inert]")).toHaveLength(3);

  act(() => { width = 100; resize(); });
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  act(() => { width = 1000; resize(); });
  expect(screen.getByRole("radio", { name: "Character" })).toHaveAttribute("aria-checked", "true");
  expect(useSettingsStore.getState().settings.precision).toBe(PrecisionLevel.Character);
});
