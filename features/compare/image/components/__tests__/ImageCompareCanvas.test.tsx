import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageCompareCanvas } from "../ImageCompareCanvas";
import { useImageCompareStore } from "../../store/useImageCompareStore";

vi.mock("../../services/ImageDiffService", () => ({
  createComparisonLayers: vi.fn(async () => ({
    width: 200,
    height: 100,
    original: Object.assign(document.createElement("canvas"), { width: 200, height: 100 }),
    modified: Object.assign(document.createElement("canvas"), { width: 200, height: 100 })
  })),
  loadComparisonImage: vi.fn(async () => Object.assign(document.createElement("canvas"), { width: 200, height: 100 })),
  renderDiff: vi.fn(async () => ({ totalPixels: 20000, differentPixels: 500, percentDifferent: 2.5 }))
}));

const image = (name: string) => ({ name, size: 100, type: "image/png", lastModified: 1, width: 200, height: 100, url: `blob:${name}`, exif: null });

describe("ImageCompareCanvas", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      disconnect() {}
    });
    useImageCompareStore.getState().clearAll();
    useImageCompareStore.setState({ originalImage: image("original"), modifiedImage: image("modified") });
  });

  afterEach(() => {
    useImageCompareStore.getState().clearAll();
  });

  it("moves the slider divider with the keyboard and labels both sides", async () => {
    useImageCompareStore.setState({ compareMode: "slider" });
    render(<ImageCompareCanvas />);
    const divider = screen.getByRole("slider", { name: "Comparison divider" });
    expect(divider).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Modified")).toBeInTheDocument();

    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(useImageCompareStore.getState().sliderPosition).toBeCloseTo(0.51, 6);
    fireEvent.keyDown(divider, { key: "ArrowLeft", shiftKey: true });
    expect(useImageCompareStore.getState().sliderPosition).toBeCloseTo(0.41, 6);
    fireEvent.keyDown(divider, { key: "End" });
    expect(useImageCompareStore.getState().sliderPosition).toBe(1);
    fireEvent.keyDown(divider, { key: "Home" });
    expect(useImageCompareStore.getState().sliderPosition).toBe(0);
  });

  it("switches to pan while Space is held over the slider", () => {
    useImageCompareStore.setState({ compareMode: "slider" });
    render(<ImageCompareCanvas />);
    const divider = screen.getByRole("slider", { name: "Comparison divider" });
    expect(divider).toHaveClass("cursor-col-resize");
    fireEvent.pointerEnter(divider);
    fireEvent.keyDown(window, { code: "Space", key: " " });
    expect(divider).toHaveClass("cursor-grab");
    fireEvent.keyUp(window, { code: "Space", key: " " });
    expect(divider).toHaveClass("cursor-col-resize");
  });

  it("offers the same zoom controls in every mode and keeps the view when switching", async () => {
    const user = userEvent.setup();
    useImageCompareStore.setState({ compareMode: "fade" });
    render(<ImageCompareCanvas />);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(useImageCompareStore.getState().viewport.zoom).toBeCloseTo(1.25, 6);
    await user.click(screen.getByRole("button", { name: "100%" }));
    expect(useImageCompareStore.getState().viewport.zoom).toBe(1);

    fireEvent.keyDown(screen.getByRole("group", { name: "Fade comparison" }), { key: "+" });
    expect(useImageCompareStore.getState().viewport.zoom).toBeCloseTo(1.25, 6);

    for (const mode of ["diff", "side-by-side", "slider"] as const) {
      act(() => useImageCompareStore.getState().setCompareMode(mode));
      expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
      expect(useImageCompareStore.getState().viewport.zoom).toBeCloseTo(1.25, 6);
    }

    await user.click(screen.getByRole("button", { name: "Fit" }));
    expect(useImageCompareStore.getState().viewport).toEqual({ zoom: 1, centerX: 0.5, centerY: 0.5 });
  });

  it("labels the fade endpoints", () => {
    useImageCompareStore.setState({ compareMode: "fade" });
    render(<ImageCompareCanvas />);
    const fade = screen.getByRole("slider", { name: "Fade between original and modified" });
    expect(fade.parentElement?.parentElement).toHaveTextContent("OriginalModified50%");
    fireEvent.change(fade, { target: { value: "800" } });
    expect(useImageCompareStore.getState().fadeValue).toBe(800);
  });

  it("shows diff statistics in the shared control bar", async () => {
    useImageCompareStore.setState({ compareMode: "diff" });
    render(<ImageCompareCanvas />);
    expect(await screen.findByText("2.50%")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });
});
