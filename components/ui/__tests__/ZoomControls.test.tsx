import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ZoomControls } from "../ZoomControls";

function renderControls(scale: number, isFit = false) {
  const onScaleChange = vi.fn();
  const onFit = vi.fn();
  render(<ZoomControls scale={scale} minScale={0.5} maxScale={4} step={1.25} onScaleChange={onScaleChange} isFit={isFit} onFit={onFit} />);
  return { onScaleChange, onFit };
}

describe("ZoomControls", () => {
  it("zooms by the step, jumps to 100% and fits", () => {
    const { onScaleChange, onFit } = renderControls(2);

    expect(screen.getByText("200%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onScaleChange).toHaveBeenLastCalledWith(2.5);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onScaleChange).toHaveBeenLastCalledWith(1.6);
    fireEvent.click(screen.getByRole("button", { name: "100%" }));
    expect(onScaleChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(onFit).toHaveBeenCalledTimes(1);
  });

  it("maps the slider on a logarithmic scale", () => {
    const { onScaleChange } = renderControls(1);
    const slider = screen.getByRole("slider", { name: "Zoom" });

    expect(slider).toHaveValue("0");
    fireEvent.change(slider, { target: { value: "100" } });
    expect(onScaleChange).toHaveBeenLastCalledWith(2);
  });

  it("disables zooming past the limits and marks the active preset", () => {
    renderControls(4, true);

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Fit" })).toHaveClass("text-accent");
    expect(screen.getByRole("button", { name: "100%" })).not.toHaveClass("text-accent");
  });
});
