import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownEditorPane } from "@/features/markdown/components/MarkdownEditorPane";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { useToastStore } from "@/store/useToastStore";

function renderEditor(onChange = vi.fn()) {
  const textareaRef = createRef<HTMLTextAreaElement>();

  const view = render(
    <MarkdownEditorPane
      value="Existing"
      onChange={onChange}
      textareaRef={textareaRef}
    />
  );

  return { ...view, onChange, textareaRef };
}

function createDropData(files: Array<File>) {
  return {
    dataTransfer: {
      types: ["Files"],
      files,
      dropEffect: ""
    }
  };
}

describe("MarkdownEditorPane", () => {
  beforeEach(() => {
    useToastStore.setState({
      activeToasts: [],
      queuedToasts: []
    });
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

  it("imports the first supported dropped markdown file as a checkpoint", async () => {
    const { container, onChange } = renderEditor();
    const imageFile = new File(["image"], "image.png", { type: "image/png" });
    const markdownFile = new File(["# Imported"], "import.md", { type: "text/markdown" });

    fireEvent.drop(container.firstElementChild as Element, createDropData([imageFile, markdownFile]));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("# Imported", { history: "checkpoint" });
    });
  });

  it("does not import unsupported dropped files", async () => {
    const { container, onChange } = renderEditor();
    const imageFile = new File(["image"], "image.png", { type: "image/png" });

    fireEvent.drop(container.firstElementChild as Element, createDropData([imageFile]));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("Existing");
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("imports selected markdown files from the file input as a checkpoint", async () => {
    const { container, onChange } = renderEditor();
    const input = container.querySelector("input[type='file']");
    const markdownFile = new File(["# Selected"], "selected.md", { type: "text/markdown" });

    fireEvent.change(input as Element, {
      target: {
        files: [markdownFile]
      }
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("# Selected", { history: "checkpoint" });
    });
  });

  it("shows a drop overlay while dragging files over the editor", () => {
    const { container } = renderEditor();

    fireEvent.dragEnter(container.firstElementChild as Element, createDropData([
      new File(["# Drag"], "drag.md", { type: "text/markdown" })
    ]));

    expect(screen.getByText("Drop Markdown or text file to import")).toBeInTheDocument();
  });

  it("does not import files from clipboard paste", () => {
    const { onChange } = renderEditor();

    fireEvent.paste(screen.getByRole("textbox"), {
      clipboardData: {
        getData: () => "",
        items: [
          {
            kind: "file",
            type: "text/markdown",
            getAsFile: () => new File(["# Pasted"], "pasted.md", { type: "text/markdown" })
          }
        ]
      }
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
