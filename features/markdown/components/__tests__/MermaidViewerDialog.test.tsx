import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidViewerDialog } from "@/features/markdown/components/MermaidViewerDialog";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

function restore(name: "showModal" | "close", descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
}

const svg = { markup: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\"><text>Label</text></svg>", width: 200, height: 100 };

describe("MermaidViewerDialog", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: () => undefined });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    restore("showModal", originalShowModal);
    restore("close", originalClose);
    Reflect.deleteProperty(HTMLElement.prototype, "setPointerCapture");
  });

  it("keeps downloads in the footer and the zoom bar shared with image compare", () => {
    const onDownload = vi.fn();
    render(<MermaidViewerDialog open onOpenChange={vi.fn()} svg={svg} onDownload={onDownload} />);

    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    fireEvent.click(screen.getByRole("button", { name: "Download SVG" }));
    expect(onDownload.mock.calls).toEqual([["png"], ["svg"]]);

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByRole("group", { name: "Zoom" })).toHaveTextContent("125%");
  });

  it("pans without starting a text selection", () => {
    render(<MermaidViewerDialog open onOpenChange={vi.fn()} svg={svg} onDownload={vi.fn()} />);
    const stage = screen.getByRole("img", { name: /Mermaid diagram/ });

    expect(stage).toHaveClass("select-none");
    expect(fireEvent.pointerDown(stage, { button: 0, pointerId: 1, clientX: 10, clientY: 10 })).toBe(false);
    expect(stage).toHaveFocus();
  });
});
