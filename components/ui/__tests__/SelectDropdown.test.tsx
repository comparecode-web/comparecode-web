import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectDropdown } from "@/components/ui/SelectDropdown";

const options = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three", label: "Three" }
];

function ControlledSelect() {
  const [value, setValue] = useState("one");

  return <SelectDropdown value={value} options={options} onChange={setValue} />;
}

describe("SelectDropdown", () => {
  it("caps the list at 14rem and dismisses it when its controls become inert", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<div><ControlledSelect /></div>);
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(screen.getByRole("listbox")).toHaveStyle({ maxHeight: "224px" });
    rerender(<div inert><ControlledSelect /></div>);
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });
  it("scales the dropdown limit with the root font size", async () => {
    const previous = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "20px";
    try {
      const user = userEvent.setup();
      render(<ControlledSelect />);
      await user.click(screen.getByRole("button", { name: "One" }));
      expect(screen.getByRole("listbox")).toHaveStyle({ maxHeight: "280px" });
    } finally {
      document.documentElement.style.fontSize = previous;
    }
  });
  it("selects an option with the pointer", async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("option", { name: "Two" }));

    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("only links the trigger to the listbox while open", async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    const trigger = screen.getByRole("button", { name: "One" });
    expect(trigger).not.toHaveAttribute("aria-controls");

    await user.click(trigger);

    const listboxId = trigger.getAttribute("aria-controls");
    expect(listboxId).toBeTruthy();
    expect(document.getElementById(listboxId ?? "")).toBeInTheDocument();
  });

  it("supports keyboard listbox navigation", async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    const trigger = screen.getByRole("button", { name: "One" });
    trigger.focus();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
  });

  it("escapes a clipping ancestor and consumes Escape before the enclosing panel", async () => {
    const user = userEvent.setup();
    const onParentKeyDown = vi.fn();
    const { container } = render(<div className="overflow-hidden" onKeyDown={onParentKeyDown}><ControlledSelect /></div>);
    const trigger = screen.getByRole("button", { name: "One" });
    await user.click(trigger);
    expect(container).not.toContainElement(screen.getByRole("listbox"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it("keeps a popup inside a dialog's top layer", async () => {
    const user = userEvent.setup();
    render(<dialog open aria-label="Example dialog"><ControlledSelect /></dialog>);
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(screen.getByRole("dialog")).toContainElement(screen.getByRole("listbox"));
    await user.click(screen.getByRole("option", { name: "Two" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
  });
});
