import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { ImageCompareToolbar } from "../ImageCompareToolbar";
import { ImageSnapshotService } from "../../services/ImageSnapshotService";
import { estimateAutoAlignment } from "../../services/alignment/autoAlignService";

vi.mock("../../services/alignment/autoAlignService", () => ({ estimateAutoAlignment: vi.fn() }));
vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null
}));

const originalImage = {
  name: "orig.png",
  size: 1000,
  type: "image/png",
  lastModified: 100,
  width: 400,
  height: 300,
  url: "blob:orig",
  exif: null
};

const modifiedImage = {
  name: "mod.png",
  size: 2000,
  type: "image/png",
  lastModified: 200,
  width: 400,
  height: 300,
  url: "blob:mod",
  exif: null
};

describe("ImageCompareToolbar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(estimateAutoAlignment).mockReset();
    useImageCompareStore.getState().clearAll();
  });

  it("renders download snapshot button as disabled when images are missing", () => {
    render(<ImageCompareToolbar />);

    const downloadButtons = screen.getAllByRole("button", { name: "Download snapshot" });
    expect(downloadButtons.length).toBeGreaterThan(0);
    downloadButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("enables download snapshot button when both images are loaded", () => {
    useImageCompareStore.setState({
      originalImage,
      modifiedImage
    });

    render(<ImageCompareToolbar />);

    const downloadButtons = screen.getAllByRole("button", { name: "Download snapshot" });
    downloadButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it("triggers downloadSnapshot on click when images are loaded", async () => {
    const downloadSpy = vi.spyOn(ImageSnapshotService, "downloadSnapshot").mockResolvedValue("comparecode-orig-vs-mod.png");

    useImageCompareStore.setState({
      originalImage,
      modifiedImage,
      compareMode: "fade",
      fadeValue: 600
    });

    render(<ImageCompareToolbar />);

    const downloadButton = screen.getAllByRole("button", { name: "Download snapshot" })[0];
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          compareMode: "fade",
          originalImage,
          modifiedImage,
          fadeValue: 600
        })
      );
    });
  });

  it("applies auto alignment only after confirmation", async () => {
    const transform = { x: 180, y: 140, scaleX: 1, scaleY: 1, rotationDeg: 0, flipX: false, flipY: false };
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: true, transform });
    useImageCompareStore.setState({ originalImage, modifiedImage });
    render(<ImageCompareToolbar />);

    fireEvent.click(screen.getByRole("button", { name: "Auto align" }));
    expect(estimateAutoAlignment).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Auto align" }));
    expect(screen.getByRole("button", { name: "Aligning..." })).toBeDisabled();
    await waitFor(() => expect(useImageCompareStore.getState().alignment.appliedTransform).toEqual(transform));
    expect(useImageCompareStore.getState().alignment.isPanelOpen).toBe(false);
    expect(useImageCompareStore.getState().compareMode).toBe("slider");
  });

  it("opens manual adjustment after a failed automatic estimate", async () => {
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: false, error: { code: "alignment/failed", message: "No shared details found" } });
    useImageCompareStore.setState({ originalImage, modifiedImage });
    render(<ImageCompareToolbar />);

    fireEvent.click(screen.getByRole("button", { name: "Auto align" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Auto align" }));
    await waitFor(() => expect(useImageCompareStore.getState().alignment.isPanelOpen).toBe(true));
    expect(useImageCompareStore.getState().alignment.error?.message).toBe("No shared details found");
  });

  it("opens the adjustment panel without running auto alignment", () => {
    useImageCompareStore.setState({ originalImage, modifiedImage });
    render(<ImageCompareToolbar />);
    fireEvent.click(screen.getByText("Adjust alignment"));
    expect(useImageCompareStore.getState().alignment.isPanelOpen).toBe(true);
    expect(useImageCompareStore.getState().alignment.appliedTransform).toBeNull();
  });

  it("disables auto alignment when both allowed transformations are off", () => {
    useImageCompareStore.setState({ originalImage, modifiedImage });
    useImageCompareStore.getState().updateAlignmentOptions({ rotate: false, scale: false });
    render(<ImageCompareToolbar />);
    expect(screen.getByRole("button", { name: "Auto align" })).toBeDisabled();
  });

  it("leaves the alignment unchanged when confirmation is cancelled", () => {
    useImageCompareStore.setState({ originalImage, modifiedImage });
    render(<ImageCompareToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Auto align" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(estimateAutoAlignment).not.toHaveBeenCalled();
    expect(useImageCompareStore.getState().alignment.appliedTransform).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
