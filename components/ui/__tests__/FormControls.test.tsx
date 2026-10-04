import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { FormField } from "../FormField";
import { Input } from "../Input";
import { Textarea } from "../Textarea";

describe("shared form controls", () => {
  it("requires an explicit submit action and respects disabled actions", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const action = vi.fn();
    render(<form onSubmit={event => { event.preventDefault(); submit(); }}>
      <Button onClick={action}>Action</Button>
      <IconButton aria-label="Icon action" onClick={action}>+</IconButton>
      <Button disabled onClick={action}>Disabled</Button>
      <Button type="submit">Submit</Button>
    </form>);
    await user.click(screen.getByRole("button", { name: "Action" }));
    await user.click(screen.getByRole("button", { name: "Icon action" }));
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(action).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(submit).toHaveBeenCalledOnce();
  });

  it("associates labels and validation messages without interrupting controlled editing", async () => {
    function Example() {
      const [value, setValue] = useState("");
      return <>
        <FormField label="Name" description="Enter a name." error={value ? undefined : "Name is required."}>{field => <Input {...field} value={value} onChange={event => setValue(event.target.value)} />}</FormField>
        <FormField label="Notes">{field => <Textarea {...field} />}</FormField>
      </>;
    }
    const user = userEvent.setup();
    render(<Example />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAccessibleDescription("Name is required.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByText("Name", { exact: true }));
    expect(input).toHaveFocus();
    await user.type(input, "CompareCode");
    expect(input).toHaveValue("CompareCode");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("Enter a name.");
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "First line{Enter}Second line");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("First line\nSecond line");
  });
});
