import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorInput } from "../ColorInput";

describe("ColorInput", () => {
  it("uses the visible native input as the picker anchor and forwards color changes", () => {
    const onChange = vi.fn();
    render(<ColorInput label="Border" value="#123456" onChange={onChange} />);
    const picker = screen.getByLabelText("Border color picker");
    expect(picker).toHaveAttribute("type", "color");
    expect(picker).not.toHaveClass("sr-only");
    expect(picker).toHaveValue("#123456");
    fireEvent.change(picker, { target: { value: "#abcdef" } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#abcdef");
  });

  it("keeps invalid hex text editable while giving the native picker a valid fallback", () => {
    render(<ColorInput label="Border" value="invalid" pickerFallback="#abc" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("invalid");
    expect(screen.getByLabelText("Border color picker")).toHaveValue("#aabbcc");
  });
});
