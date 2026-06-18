import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IdenticalTextInfoBar } from "@/features/compare/text/components/diff/IdenticalTextInfoBar";

describe("IdenticalTextInfoBar", () => {
  it("renders the identical text message with info token classes when visible", () => {
    render(<IdenticalTextInfoBar isVisible />);

    const message = screen.getByText("The two texts are completely identical.");
    const bar = message.closest("div");

    expect(message).toBeInTheDocument();
    expect(bar).toHaveClass("bg-info-bg", "border-info-border", "text-info");
  });

  it("does not render when hidden", () => {
    render(<IdenticalTextInfoBar isVisible={false} />);

    expect(screen.queryByText("The two texts are completely identical.")).not.toBeInTheDocument();
  });
});
