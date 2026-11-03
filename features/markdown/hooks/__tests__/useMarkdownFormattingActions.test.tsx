import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyMarkdownEditResult } from "@/features/markdown/hooks/useMarkdownFormattingActions";

function Editor({ onReady }: { onReady: (setValue: (value: string) => void) => void }) {
  const [value, setValue] = useState("first\nsecond\nthird");
  onReady(setValue);
  return <textarea aria-label="Editor" value={value} onChange={(event) => setValue(event.target.value)} />;
}

describe("applyMarkdownEditResult", () => {
  it("commits the edit and restores the scroll position and selection before the next paint", () => {
    let setValue: (value: string) => void = () => undefined;
    render(<Editor onReady={(setter) => { setValue = setter; }} />);
    const textarea = screen.getByRole("textbox", { name: "Editor" }) as HTMLTextAreaElement;
    textarea.focus();
    textarea.scrollTop = 120;
    textarea.scrollLeft = 8;

    act(() => {
      applyMarkdownEditResult(textarea, { value: "first\n## second\nthird", selectionStart: 9, selectionEnd: 15 }, (value) => setValue(value));
      expect(textarea.value).toBe("first\n## second\nthird");
      expect(textarea.scrollTop).toBe(120);
      expect(textarea.scrollLeft).toBe(8);
      expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([9, 15]);
    });
  });
});
