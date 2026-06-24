import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("selects an option with the pointer", async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("option", { name: "Two" }));

    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
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
});
