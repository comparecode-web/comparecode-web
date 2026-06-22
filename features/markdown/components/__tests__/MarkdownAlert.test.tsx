import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownAlert } from "@/features/markdown/components/MarkdownAlert";

describe("MarkdownAlert", () => {
  it("renders GitHub-style note alerts with styled title and content", () => {
    render(
      <MarkdownAlert>
        <p>[!NOTE] Useful information that users should know.</p>
      </MarkdownAlert>
    );

    expect(screen.getByText("Note").parentElement).toHaveClass("text-blue-700");
    expect(screen.getByText("Useful information that users should know.")).toBeInTheDocument();
  });

  it("detects alert markers after leading whitespace nodes", () => {
    render(
      <MarkdownAlert>
        {"\n"}
        <p>[!WARNING] Urgent info that needs attention.</p>
      </MarkdownAlert>
    );

    expect(screen.getByText("Warning").parentElement).toHaveClass("text-yellow-800");
    expect(screen.getByText("Urgent info that needs attention.")).toBeInTheDocument();
    expect(screen.queryByText("[!WARNING]")).not.toBeInTheDocument();
  });

  it("removes the leading break left after an alert marker", () => {
    const { container } = render(
      <MarkdownAlert>
        <p>
          {"[!IMPORTANT]"}
          <br />
          {"Key information users need to know."}
        </p>
      </MarkdownAlert>
    );

    const contentParagraph = screen.getByText("Key information users need to know.").closest("p");

    expect(screen.getByText("Important").parentElement).toHaveClass("text-violet-700");
    expect(contentParagraph?.querySelector("br")).not.toBeInTheDocument();
    expect(container.querySelector("p")?.textContent).toBe("Key information users need to know.");
  });

  it("keeps normal blockquotes when no alert marker is present", () => {
    render(
      <MarkdownAlert>
        <p>Regular quote content.</p>
      </MarkdownAlert>
    );

    expect(screen.getByText("Regular quote content.").closest("blockquote")).toBeInTheDocument();
  });
});
