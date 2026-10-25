import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MermaidBlock } from "../MermaidBlock";

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async (id: string, chart: string) => {
    if (chart.includes("Works")) {
      return { svg: `<svg id="${id}"><text>Works</text></svg>` };
    }
    const leftover = document.createElement("div");
    leftover.id = `d${id}`;
    leftover.textContent = "Syntax error in text";
    document.body.append(leftover);
    throw new Error("Parse error on line 2");
  })
}));

vi.mock("mermaid/dist/mermaid.esm.min.mjs", () => ({ default: mermaid }));

describe("MermaidBlock", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps a failed diagram's error output out of the page", async () => {
    const { container } = render(<MermaidBlock chart={"graph TD\n  A -->"} />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector("pre")).toHaveTextContent("graph TD"));

    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict", suppressErrorRendering: true }));
    expect(document.body.querySelector('[id^="dcomparecode-mermaid"]')).toBeNull();
    expect(document.body).not.toHaveTextContent("Syntax error in text");
  });

  it("renders the diagram once a broken chart is fixed", async () => {
    const { rerender } = render(<MermaidBlock chart={"graph TD\n  A -->"} />);
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1));

    rerender(<MermaidBlock chart={"graph TD\n  Fixed --> Works"} />);

    expect(await screen.findByText("Works", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(mermaid.render).toHaveBeenCalledTimes(2);
  });
});
