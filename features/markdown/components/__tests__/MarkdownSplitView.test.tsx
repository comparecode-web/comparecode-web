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
      isSyncScrollEnabled: true,
      editorPaneWidthPercent: 50,
      isWordWrapEnabled: true,
      fontSize: 16,
      viewMode: "split"
    });
  });

  it("uses a subtle horizontal resize handle without tooltip", () => {
    render(
      <MarkdownSplitView
        value="Preview"
        onChange={() => undefined}
        textareaRef={createRef<HTMLTextAreaElement>()}
      />
    );

    const resizeHandle = screen.getByRole("button");

    expect(resizeHandle).toHaveClass("cursor-ew-resize");
    expect(resizeHandle).toHaveClass("bg-border-default/35");
    expect(resizeHandle).not.toHaveAttribute("title");
  });
});
