import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";
import { MenuItem, PopoverMenu } from "../PopoverMenu";

function Example() {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <><Button ref={ref} onClick={() => setOpen(!open)}>Actions</Button><PopoverMenu isOpen={open} onOpenChange={setOpen} triggerRef={ref}><MenuItem>First</MenuItem><MenuItem disabled>Unavailable</MenuItem><MenuItem>Last</MenuItem></PopoverMenu></>;
}

describe("PopoverMenu", () => {
  it("moves focus between enabled actions and restores trigger focus on Escape", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Last" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Last" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });
});
