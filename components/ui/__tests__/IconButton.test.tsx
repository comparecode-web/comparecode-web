import { MdTune } from "react-icons/md";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconButton } from "@/components/ui/IconButton";

describe("IconButton", () => {
  it("uses focus-visible styling instead of persistent focus styling", () => {
    render(
      <IconButton title="Options">
        <MdTune />
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Options" });

    expect(button).toHaveClass("focus-visible:ring-2");
    expect(button).not.toHaveClass("focus:ring-2");
  });

  it("renders active state only when explicitly requested", () => {
    render(
      <IconButton title="Options" isActive>
        <MdTune />
      </IconButton>
    );

    expect(screen.getByRole("button", { name: "Options" })).toHaveClass("text-accent-primary");
  });
});
