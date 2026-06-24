import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOptionsPanelShortcut } from "@/components/layout/useOptionsPanelShortcut";

function ShortcutHarness({ onToggle }: { onToggle: () => void }) {
  useOptionsPanelShortcut(onToggle);

  return <input aria-label="Editable" />;
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
});
