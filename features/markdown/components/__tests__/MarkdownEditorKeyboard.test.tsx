import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownEditorPane } from "@/features/markdown/components/MarkdownEditorPane";
import { markdownEditorTabExitEvent } from "@/features/markdown/hooks/useMarkdownKeyboardShortcuts";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

function renderEditor(value: string, selection = value.length) {
  const onChange = vi.fn();
  const textareaRef = createRef<HTMLTextAreaElement>();
  render(<MarkdownEditorPane value={value} onChange={onChange} textareaRef={textareaRef} />);
  const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
  textarea.focus();
  textarea.setSelectionRange(selection, selection);
  return { textarea, onChange };
}

describe("Markdown editor keyboard", () => {
  beforeEach(() => {
    useMarkdownUIStore.setState({ isLoaded: true, isWordWrapEnabled: true, fontSize: 16 });
  });

  it("formats with Ctrl+B, Ctrl+I, Ctrl+K and Ctrl+E as separate operations", () => {
    const { textarea, onChange } = renderEditor("word", 0);
    const press = (init: KeyboardEventInit) => {
      textarea.setSelectionRange(0, 4);
      fireEvent.keyDown(textarea, init);
    };

    press({ key: "b", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("**word**", { history: "operation" });

    press({ key: "I", metaKey: true });
    expect(onChange).toHaveBeenLastCalledWith("*word*", { history: "operation" });

    press({ key: "k", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("[word](https://example.com)", { history: "operation" });

    press({ key: "e", ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith("`word`", { history: "operation" });
  });

  it("ignores AltGr combinations so characters can still be typed", () => {
    const { textarea, onChange } = renderEditor("word", 4);
    const event = new KeyboardEvent("keydown", { key: "b", ctrlKey: true, altKey: true, bubbles: true, cancelable: true });

    textarea.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("continues lists on Enter but not while composing text", () => {
    const { textarea, onChange } = renderEditor("- item");

    fireEvent.keyDown(textarea, { key: "Enter", isComposing: true });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("- item\n- ", { history: "operation" });
  });

  it("indents with Tab and lets the next Tab leave the editor after Escape", () => {
    const { textarea, onChange } = renderEditor("text", 0);
    const firstTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(firstTab);

    expect(firstTab.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith("  text", { history: "operation" });

    fireEvent.keyDown(textarea, { key: "Escape" });
    const exitTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(exitTab);
    expect(exitTab.defaultPrevented).toBe(false);

    const nextTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(nextTab);
    expect(nextTab.defaultPrevented).toBe(true);
  });

  it("clears the exit state on blur or other keys", () => {
    const { textarea } = renderEditor("text", 0);

    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.blur(textarea);
    textarea.focus();
    const afterBlur = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(afterBlur);
    expect(afterBlur.defaultPrevented).toBe(true);

    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.keyDown(textarea, { key: "a" });
    const afterKey = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(afterKey);
    expect(afterKey.defaultPrevented).toBe(true);
  });

  it("arms the Tab exit when a full screen session ends while the editor is focused", () => {
    const { textarea } = renderEditor("text", 0);

    act(() => {
      window.dispatchEvent(new Event(markdownEditorTabExitEvent));
    });
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(false);
  });

  it("does not arm the exit when another element consumed Escape", () => {
    const { textarea } = renderEditor("text", 0);
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    escape.preventDefault();

    textarea.dispatchEvent(escape);
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(true);
  });
});

describe("Markdown undo operations", () => {
  beforeEach(() => {
    useMarkdownStore.setState({ markdownText: "", past: [], future: [], pendingUndoValue: null, canUndo: false, canRedo: false, isLoaded: true });
  });

  it("keeps typing and a following formatting operation as separate undo steps", () => {
    const { setMarkdownText } = useMarkdownStore.getState();
    setMarkdownText("word");
    setMarkdownText("**word**", { history: "operation" });

    useMarkdownStore.getState().undoMarkdownText();
    expect(useMarkdownStore.getState().markdownText).toBe("word");

    useMarkdownStore.getState().undoMarkdownText();
    expect(useMarkdownStore.getState().markdownText).toBe("");
  });

  it("undoes a list continuation as one step", () => {
    const { setMarkdownText } = useMarkdownStore.getState();
    setMarkdownText("- item");
    setMarkdownText("- item\n- ", { history: "operation" });

    useMarkdownStore.getState().undoMarkdownText();
    expect(useMarkdownStore.getState().markdownText).toBe("- item");
  });
});
