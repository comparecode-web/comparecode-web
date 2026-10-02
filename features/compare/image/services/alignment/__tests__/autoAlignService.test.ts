import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estimateAutoAlignment } from "../autoAlignService";
import type { ImageFileMeta } from "../../../store/useImageCompareStore";

const meta: ImageFileMeta = { name: "image.png", size: 100, type: "image/png", width: 1280, height: 720, url: "blob:image", lastModified: 1, exif: null };
const options = { rotate: true, scale: true, warp: false };
const transform = { x: 640, y: 360, scaleX: 1, scaleY: 1, rotationDeg: 0, flipX: false, flipY: false };
let workers: FakeWorker[];
let failImage = false;

class FakeImage {
  naturalWidth = 1280;
  naturalHeight = 720;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    if (value) Promise.resolve().then(() => failImage ? this.onerror?.() : this.onload?.());
  }
}

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { workers.push(this); }
}

async function start(signal?: AbortSignal) {
  const promise = estimateAutoAlignment(meta, meta, options, signal);
  await vi.waitFor(() => expect(workers).toHaveLength(1));
  return { promise, worker: workers[0] };
}

describe("auto alignment browser service", () => {
  beforeEach(() => {
    workers = [];
    failImage = false;
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("Worker", FakeWorker);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(640 * 360 * 4) })
    }) as unknown as CanvasRenderingContext2D);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("bounds decoding work, transfers pixel buffers and releases a successful worker", async () => {
    const { promise, worker } = await start();
    const [request, transfers] = worker.postMessage.mock.calls[0];
    expect(request.original).toMatchObject({ width: 640, height: 360, sourceWidth: 1280, sourceHeight: 720 });
    expect(transfers).toHaveLength(2);
    worker.onmessage?.({ data: { transform, confidence: 0.9, matchCount: 20 } });
    expect(await promise).toMatchObject({ success: true, transform });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("reports insufficient content without applying a guessed transform", async () => {
    const { promise, worker } = await start();
    worker.onmessage?.({ data: null });
    expect(await promise).toMatchObject({ success: false, error: { code: "alignment/no-match" } });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("terminates work on abort", async () => {
    const controller = new AbortController();
    const { promise, worker } = await start(controller.signal);
    controller.abort();
    expect(await promise).toMatchObject({ success: false, error: { code: "alignment/cancelled" } });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("does not start work for an already aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await estimateAutoAlignment(meta, meta, options, controller.signal)).toMatchObject({ success: false });
    expect(workers).toHaveLength(0);
  });

  it("cleans up a stalled worker after the deadline", async () => {
    vi.useFakeTimers();
    const { promise, worker } = await start();
    await vi.advanceTimersByTimeAsync(15000);
    expect(await promise).toMatchObject({ success: false, error: { code: "alignment/failed" } });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("reports worker and image decode failures", async () => {
    const { promise, worker } = await start();
    worker.onerror?.();
    expect(await promise).toMatchObject({ success: false });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    failImage = true;
    expect(await estimateAutoAlignment(meta, meta, options)).toMatchObject({ success: false });
    expect(workers).toHaveLength(1);
  });
});
