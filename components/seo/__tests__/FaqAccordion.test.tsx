import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "@/components/seo/FaqAccordion";

describe("FaqAccordion", () => {
  it("animates answer panels instead of mounting them abruptly", async () => {
    const user = userEvent.setup();
    render(
      <FaqAccordion
        items={[
          {
            question: "What is CompareCode?",
            answer: "A browser-based comparison tool."
          }
        ]}
      />
    );

    const button = screen.getByRole("button", { name: "What is CompareCode?" });
    const panel = screen.getByText("A browser-based comparison tool.").closest("[id]");

    expect(panel).toHaveClass("grid-rows-[0fr]", "opacity-0");

    await user.click(button);

    expect(panel).toHaveClass("grid-rows-[1fr]", "opacity-100");

    await user.click(button);

    expect(panel).toHaveClass("grid-rows-[0fr]", "opacity-0");
  });
});
