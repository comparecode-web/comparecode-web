import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "@/features/markdown/components/CodeBlock";

describe("CodeBlock", () => {
  it("uses compact code-specific line height for multiline blocks", () => {
    const { container } = render(
      <CodeBlock language="ts">
        {"const first = true;\nconst second = false;"}
      </CodeBlock>
    );

    const pre = container.querySelector("pre");

    expect(pre).toHaveClass("leading-5");
    expect(pre).not.toHaveClass("leading-7");
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
    expect(container.querySelector("br")).not.toBeInTheDocument();
  });
});
