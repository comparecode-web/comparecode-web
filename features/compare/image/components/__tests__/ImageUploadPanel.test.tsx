import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/store/useToastStore";
import { ImageUploadPanel } from "../ImageUploadPanel";
import { useImageCompareStore } from "../../store/useImageCompareStore";

type ImageOutcome = { width: number; height: number } | "error";
let nextImage: ImageOutcome = { width: 100, height: 50 };

class FakeImage {
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    const outcome = nextImage;
    queueMicrotask(() => {
      if (outcome === "error") {
        this.onerror?.();
        return;
      }
      this.naturalWidth = outcome.width;
      this.naturalHeight = outcome.height;
      this.onload?.();
    });
  }
}

function upload(container: HTMLElement, file: File) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [file] } });
}

const toastMessages = () => useToastStore.getState().activeToasts.map((toast) => toast.message);

describe("ImageUploadPanel", () => {
  beforeEach(() => {
    nextImage = { width: 100, height: 50 };
    vi.stubGlobal("Image", FakeImage);
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    useToastStore.setState({ activeToasts: [], queuedToasts: [] });
    useImageCompareStore.getState().clearAll();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("explains that a non-image file cannot be used", async () => {
    const { container } = render(<ImageUploadPanel />);
    upload(container, new File(["hello"], "notes.txt", { type: "text/plain" }));
    await waitFor(() => expect(toastMessages()).toEqual(["Choose an image file, such as PNG, JPEG, WebP, or SVG."]));
    expect(useImageCompareStore.getState().originalImage).toBeNull();
  });

  it("shows each different upload problem", async () => {
    const { container } = render(<ImageUploadPanel />);
    upload(container, new File(["hello"], "notes.txt", { type: "text/plain" }));
    nextImage = "error";
    upload(container, new File(["broken"], "broken.png", { type: "image/png" }));
    await waitFor(() => expect(toastMessages()).toHaveLength(2));
    expect(toastMessages()[1]).toContain("could not be opened");
  });

  it("explains that an image could not be decoded", async () => {
    nextImage = "error";
    const { container } = render(<ImageUploadPanel />);
    upload(container, new File(["broken"], "broken.png", { type: "image/png" }));
    await waitFor(() => expect(toastMessages()[0]).toContain("could not be opened"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(useImageCompareStore.getState().originalImage).toBeNull();
  });

  it("rejects an image the browser cannot draw", async () => {
    nextImage = { width: 40_000, height: 30_000 };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<ImageUploadPanel />);
    upload(container, new File(["huge"], "huge.png", { type: "image/png" }));
    await waitFor(() => expect(toastMessages()).toEqual(["This image (40000x30000) is too large for this browser."]));
    expect(useImageCompareStore.getState().originalImage).toBeNull();
  });

  it("keeps a valid image even when its metadata cannot be read", async () => {
    const { container } = render(<ImageUploadPanel />);
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "arrayBuffer", { value: () => Promise.reject(new Error("read failed")) });
    upload(container, file);
    await waitFor(() => expect(useImageCompareStore.getState().originalImage).toMatchObject({ name: "photo.jpg", width: 100, height: 50 }));
    expect(toastMessages()).toEqual([]);
  });
});
