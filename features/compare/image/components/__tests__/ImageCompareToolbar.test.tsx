import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { ImageCompareToolbar } from "../ImageCompareToolbar";
import { ImageSnapshotService } from "../../services/ImageSnapshotService";

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
});
