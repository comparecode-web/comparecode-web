import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ImageAlignmentPanel } from "../alignment/ImageAlignmentPanel";
import { useImageCompareStore } from "../../store/useImageCompareStore";

vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null
}));

const originalImage = { name: "original.png", size: 100, type: "image/png", lastModified: 1, width: 400, height: 300, url: "blob:original", exif: null };
const modifiedImage = { ...originalImage, name: "modified.png", url: "blob:modified", width: 200, height: 100 };

function editNumber(label: string, value: string) {
  const field = screen.getByRole("textbox", { name: label });
  fireEvent.focus(field);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

describe("ImageAlignmentPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      disconnect() {}
    });
    useImageCompareStore.getState().clearAll();
    useImageCompareStore.setState({ originalImage, modifiedImage, fadeValue: 750 });
    useImageCompareStore.getState().openAlignmentPanel();
  });

  afterEach(() => {
    cleanup();
    useImageCompareStore.getState().clearAll();
    vi.unstubAllGlobals();
  });

  it("adjusts and resets the preview without changing the image transform or Fade", () => {
    render(<ImageAlignmentPanel />);
    const transform = useImageCompareStore.getState().alignment.draftTransform;
    fireEvent.change(screen.getByRole("slider", { name: "Overlay opacity" }), { target: { value: "20" } });
    fireEvent.change(screen.getByRole("slider", { name: "Preview zoom" }), { target: { value: "150" } });
    expect(useImageCompareStore.getState().alignment).toMatchObject({ opacity: 0.2, previewZoom: 1.5, draftTransform: transform, appliedTransform: null });
    expect(screen.getByAltText("Modified")).toHaveStyle({ opacity: "0.2" });
    expect(useImageCompareStore.getState().fadeValue).toBe(750);

    fireEvent.click(screen.getByRole("button", { name: "Restore Preview defaults" }));
    expect(useImageCompareStore.getState().alignment).toMatchObject({ opacity: 0.5, previewZoom: 1, draftTransform: transform });
  });

  it("converts size units without changing the transform and preserves proportional edits", () => {
    render(<ImageAlignmentPanel />);
    expect(screen.getByRole("textbox", { name: "Width" })).toHaveValue("100");
    editNumber("Width", "150");
    expect(useImageCompareStore.getState().alignment.draftTransform).toMatchObject({ scaleX: 1.5, scaleY: 1.5 });

    fireEvent.click(screen.getByRole("radio", { name: "px" }));
    expect(screen.getByRole("textbox", { name: "Width" })).toHaveValue("300");
    expect(screen.getByRole("textbox", { name: "Height" })).toHaveValue("150");
    editNumber("Height", "200");
    expect(useImageCompareStore.getState().alignment.draftTransform).toMatchObject({ scaleX: 2, scaleY: 2 });

    fireEvent.click(screen.getByRole("radio", { name: "%" }));
    expect(screen.getByRole("textbox", { name: "Width" })).toHaveValue("200");
    expect(screen.getByRole("slider", { name: "Scale" })).toBeInTheDocument();
  });

  it("offers separate scale controls when unlocked and applies only on request", () => {
    render(<ImageAlignmentPanel />);
    fireEvent.click(screen.getByTitle("Unlock proportional scale"));
    fireEvent.change(screen.getByRole("slider", { name: "Width scale" }), { target: { value: "125" } });
    fireEvent.change(screen.getByRole("slider", { name: "Height scale" }), { target: { value: "175" } });
    expect(useImageCompareStore.getState().alignment.appliedTransform).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(useImageCompareStore.getState().alignment.appliedTransform).toMatchObject({ scaleX: 1.25, scaleY: 1.75 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels manual changes without applying them", () => {
    render(<ImageAlignmentPanel />);
    editNumber("Width", "200");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(useImageCompareStore.getState().alignment.appliedTransform).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets manual adjustments without resetting preview or automatic options", () => {
    useImageCompareStore.getState().setAlignmentOpacity(0.2);
    useImageCompareStore.getState().updateAlignmentOptions({ rotate: false });
    render(<ImageAlignmentPanel />);
    editNumber("Width", "150");
    fireEvent.click(screen.getByRole("button", { name: "Restore Manual adjustments defaults" }));
    const { alignment } = useImageCompareStore.getState();
    expect(alignment.draftTransform).toMatchObject({ scaleX: 1, scaleY: 1 });
    expect(alignment.opacity).toBe(0.2);
    expect(alignment.options.rotate).toBe(false);
  });

  it("resets automatic options without resetting the manual draft", () => {
    useImageCompareStore.getState().updateAlignmentOptions({ rotate: false, scale: false });
    render(<ImageAlignmentPanel />);
    editNumber("Width", "150");
    fireEvent.click(screen.getByRole("button", { name: "Restore Auto align defaults" }));
    const { alignment } = useImageCompareStore.getState();
    expect(alignment.options).toEqual({ rotate: true, scale: true, warp: false });
    expect(alignment.draftTransform).toMatchObject({ scaleX: 1.5, scaleY: 1.5 });
  });
});
