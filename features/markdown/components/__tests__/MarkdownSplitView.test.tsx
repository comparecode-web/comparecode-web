import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MarkdownSplitView } from "@/features/markdown/components/MarkdownSplitView";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

describe("MarkdownSplitView", () => {
  beforeEach(() => {
    useMarkdownUIStore.setState({
      isLoaded: true,
      isOptionsPanelOpen: true,
      optionsPanelTab: "options",
      isSyncScrollEnabled: true,
      editorPaneWidthPercent: 50,
      isWordWrapEnabled: true,
      fontSize: 16,
      viewMode: "split"
    });
  });

  it("uses a subtle horizontal resize handle without tooltip", () => {
    const { container } = render(
      <MarkdownSplitView
        value="Preview"
        onChange={() => undefined}
        textareaRef={createRef<HTMLTextAreaElement>()}
      />
    );

    const resizeHandle = container.querySelector("button[class*='!cursor-ew-resize']");

    expect(resizeHandle).toHaveClass("!cursor-ew-resize");
    expect(resizeHandle).toHaveClass("bg-border-default/35");
    expect(resizeHandle).not.toHaveAttribute("title");
  });

  it("shows editor line numbers and moves summary stats to the preview header in split view", () => {
    const { container } = render(
      <MarkdownSplitView
        value={"one two\nthree"}
        onChange={() => undefined}
        textareaRef={createRef<HTMLTextAreaElement>()}
      />
    );

    expect(container.querySelectorAll(".tabular-nums")).toHaveLength(2);
    expect(screen.getByText("3 Words")).toBeInTheDocument();
    expect(screen.getByText("13 Characters")).toBeInTheDocument();
  });
});
