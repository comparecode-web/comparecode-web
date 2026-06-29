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

  it("keeps only one answer panel open at a time", async () => {
    const user = userEvent.setup();
    render(
      <FaqAccordion
        items={[
          {
            question: "How do I use text compare?",
            answer: "Paste two texts and run the comparison."
          },
          {
            question: "How does history work?",
            answer: "Saved comparisons can be restored later."
          }
        ]}
      />
    );

    const firstButton = screen.getByRole("button", { name: "How do I use text compare?" });
    const secondButton = screen.getByRole("button", { name: "How does history work?" });
    const firstPanel = screen.getByText("Paste two texts and run the comparison.").closest("[id]");
    const secondPanel = screen.getByText("Saved comparisons can be restored later.").closest("[id]");

    await user.click(firstButton);

    expect(firstPanel).toHaveClass("grid-rows-[1fr]", "opacity-100");
    expect(secondPanel).toHaveClass("grid-rows-[0fr]", "opacity-0");

    await user.click(secondButton);

    expect(firstPanel).toHaveClass("grid-rows-[0fr]", "opacity-0");
    expect(secondPanel).toHaveClass("grid-rows-[1fr]", "opacity-100");
  });
});
