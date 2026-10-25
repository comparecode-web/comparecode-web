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
  it("closes when disabled and stays closed when enabled again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<SelectDropdown value="one" options={options} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    rerender(<SelectDropdown disabled value="one" options={options} onChange={onChange} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(onChange).not.toHaveBeenCalled();
    rerender(<SelectDropdown value="one" options={options} onChange={onChange} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("caps the list at 14.5rem and dismisses it when its controls become inert", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<div><ControlledSelect /></div>);
    await user.click(screen.getByRole("button", { name: "One" }));
    expect(screen.getByRole("listbox")).toHaveStyle({ maxHeight: "232px" });
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
      expect(screen.getByRole("listbox")).toHaveStyle({ maxHeight: "290px" });
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

  it("renders labelled option groups without changing keyboard navigation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const groupedOptions = [
      { value: "light", label: "Light", group: "Light themes" },
      { value: "sand", label: "Sand", group: "Light themes" },
      { value: "dark", label: "Dark", group: "Dark themes" }
    ];
    render(<SelectDropdown label="Theme" value="sand" options={groupedOptions} onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: "Theme: Sand" });
    await user.click(trigger);

    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Light themes" })).not.toHaveClass("border-t");
    expect(screen.getByRole("group", { name: "Dark themes" })).toHaveClass("border-t", "border-border-default");
    expect(screen.getByRole("group", { name: "Light themes" })).toContainElement(screen.getByRole("option", { name: "Sand" }));
    expect(screen.getByRole("group", { name: "Dark themes" })).toContainElement(screen.getByRole("option", { name: "Dark" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Light", "Sand", "Dark"]);

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("dark");
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
