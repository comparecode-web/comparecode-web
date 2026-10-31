import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { InputView } from "../InputView";
import { defaultSettings } from "@/config/defaults";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextStore } from "@/features/compare/text/store/useTextStore";
import { useToastStore } from "@/store/useToastStore";
import { ToastViewport } from "@/components/layout/ToastViewport";

const executeCompare = vi.hoisted(() => vi.fn());
vi.mock("@/features/compare/text/hooks/useTextCompareActions", () => ({ useTextCompareActions: () => ({ executeCompare }) }));

function renderInput() {
  return render(<><InputView onImportFiles={() => {}} onOpenFile={() => {}} /><ToastViewport /></>);
}

async function choose(user: ReturnType<typeof userEvent.setup>, side: "Original" | "Modified", item: string) {
  await user.click(screen.getAllByRole("button", { name: `Transform ${side.toLowerCase()} text` })[0]);
  await user.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: item }));
}

beforeEach(() => {
  executeCompare.mockClear();
  useSettingsStore.setState({ settings: { ...defaultSettings }, isLoaded: true });
  useTextStore.getState().clearContent();
  useToastStore.setState({ activeToasts: [], queuedToasts: [] });
});

it("transforms one side, offers undo when native undo is unavailable, and recompares an existing result", async () => {
  const user = userEvent.setup();
  useTextStore.setState({ leftText: "B\nA\n", rightText: "KEEP" });
  useTextStore.getState().compare(defaultSettings);
  renderInput();
  await choose(user, "Original", "Sort lines");
  expect(useTextStore.getState()).toMatchObject({ leftText: "A\nB\n", rightText: "KEEP" });
  expect(executeCompare).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(useTextStore.getState().leftText).toBe("B\nA\n");
  expect(executeCompare).toHaveBeenCalledTimes(2);
});

it("applies a transform to both sides when requested", async () => {
  const user = userEvent.setup();
  useTextStore.setState({ leftText: "ABC", rightText: "Def" });
  renderInput();
  await user.click(screen.getAllByRole("button", { name: "Transform modified text" })[0]);
  await user.click(screen.getByRole("menuitem", { name: "Apply to both sides, off" }));
  await user.click(screen.getByRole("menuitem", { name: "Lowercase" }));
  expect(useTextStore.getState()).toMatchObject({ leftText: "abc", rightText: "def" });
  expect(executeCompare).not.toHaveBeenCalled();
});

it("reports unchanged text and does not overwrite later edits on undo", async () => {
  const user = userEvent.setup();
  useTextStore.setState({ leftText: "abc", rightText: "x" });
  renderInput();
  await choose(user, "Original", "Lowercase");
  expect(screen.getByText("The text is already in this form.")).toBeInTheDocument();
  useTextStore.setState({ leftText: "  padded  " });
  await choose(user, "Original", "Trim whitespace");
  expect(useTextStore.getState().leftText).toBe("padded");
  useTextStore.getState().setLeftText("edited later");
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(useTextStore.getState().leftText).toBe("edited later");
});

it("disables transforms without input", () => {
  renderInput();
  for (const button of screen.getAllByRole("button", { name: /Transform .* text/ })) expect(button).toBeDisabled();
});

it("formats JSON, reports invalid JSON without changing the text, and warns about duplicate keys", async () => {
  const user = userEvent.setup();
  useTextStore.setState({ leftText: JSON.stringify({ b: 1, a: 2 }), rightText: "{\"a\":1,\"a\":2}" });
  renderInput();
  await choose(user, "Original", "Sort JSON keys");
  expect(useTextStore.getState().leftText).toBe("{\n  \"a\": 2,\n  \"b\": 1\n}");
  await choose(user, "Modified", "Format JSON (tabs)");
  expect(useTextStore.getState().rightText).toBe("{\n\t\"a\": 1,\n\t\"a\": 2\n}");
  expect(screen.getByText("The JSON contains a duplicate property name. Both values are kept.")).toBeInTheDocument();
  useTextStore.setState({ leftText: "{\"a\":1,}" });
  await choose(user, "Original", "Minify JSON");
  expect(useTextStore.getState().leftText).toBe("{\"a\":1,}");
  expect(screen.getByText("Invalid JSON at line 1, column 8: trailing commas are not allowed in JSON.")).toBeInTheDocument();
});

