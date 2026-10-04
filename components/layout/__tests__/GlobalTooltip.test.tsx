import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlobalTooltip } from "../GlobalTooltip";

describe("GlobalTooltip", () => {
  it("keeps a modal control's tooltip inside the native dialog top layer", () => {
    render(<><dialog open aria-label="Example"><button title="Restore zoom">Reset</button></dialog><GlobalTooltip /></>);
    fireEvent.mouseOver(screen.getByRole("button", { name: "Reset" }));
    expect(within(screen.getByRole("dialog")).getByRole("tooltip")).toHaveTextContent("Restore zoom");
    fireEvent.mouseOut(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
