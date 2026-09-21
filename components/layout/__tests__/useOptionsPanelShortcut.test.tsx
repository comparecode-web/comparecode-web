import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOptionsPanelShortcut } from "@/components/layout/useOptionsPanelShortcut";

function ShortcutHarness({ onToggle }: { onToggle: () => void }) {
  useOptionsPanelShortcut(onToggle);

  return <><input aria-label="Editable" /><div data-tool-controls><button>Option control</button></div></>;
}

describe("useOptionsPanelShortcut", () => {
  it("toggles the options panel with the O key", () => {
    const onToggle = vi.fn();
    render(<ShortcutHarness onToggle={onToggle} />);

    fireEvent.keyDown(document, { key: "o" });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated, modified, and editable-target key presses", () => {
    const onToggle = vi.fn();
    const { getByLabelText } = render(<ShortcutHarness onToggle={onToggle} />);

    fireEvent.keyDown(document, { key: "o", repeat: true });
    fireEvent.keyDown(document, { key: "o", ctrlKey: true });
    fireEvent.keyDown(getByLabelText("Editable"), { key: "o" });

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("does not toggle workspace panels from controls or behind an open dialog", () => {
    const onToggle = vi.fn();
    const { getByRole, rerender } = render(<ShortcutHarness onToggle={onToggle} />);
    fireEvent.keyDown(getByRole("button"), { key: "o" });
    expect(onToggle).not.toHaveBeenCalled();
    rerender(<><ShortcutHarness onToggle={onToggle} /><dialog open><button>Inside dialog</button></dialog></>);
    fireEvent.keyDown(document, { key: "o" });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
