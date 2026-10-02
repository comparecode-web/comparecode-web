import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estimateAutoAlignment, type AutoAlignResult } from "../../services/alignment/autoAlignService";
import { getPairKey } from "../../services/alignment/transformUtils";
import { DEFAULT_ALIGNMENT_STATE } from "@/features/compare/image/services/alignment/types";
import { useImageCompareStore } from "@/features/compare/image/store/useImageCompareStore";

const originalImage = {
  name: "original.png",
  size: 100,
  type: "image/png",
  lastModified: 1,
  width: 100,
  height: 80,
  url: "blob:original",
  exif: null
};

const modifiedImage = {
  name: "modified.png",
  size: 100,
  type: "image/png",
  lastModified: 1,
  width: 90,
  height: 70,
  url: "blob:modified",
  exif: null
};

vi.mock("../../services/alignment/autoAlignService", () => ({ estimateAutoAlignment: vi.fn() }));

const autoTransform = { x: 42, y: 37, scaleX: 1.2, scaleY: 1.2, rotationDeg: 12, flipX: false, flipY: false };

describe("useImageCompareStore alignment", () => {
  beforeEach(() => {
    useImageCompareStore.getState().clearAll();
    vi.clearAllMocks();
    useImageCompareStore.setState({
      originalImage,
      modifiedImage,
      alignment: {
        ...DEFAULT_ALIGNMENT_STATE,
        options: { ...DEFAULT_ALIGNMENT_STATE.options },
        isPanelOpen: true,
        snappingEnabled: false,
        aspectRatioLocked: false,
        draftTransform: {
          x: 25,
          y: 35,
          scaleX: 1.5,
          scaleY: 0.75,
          rotationDeg: 15,
          flipX: true,
          flipY: false
        }
      }
    });
  });

  afterEach(() => useImageCompareStore.getState().clearAll());

  it("resets manual alignment controls to their defaults", () => {
    useImageCompareStore.getState().resetAlignmentDraft();

    const alignment = useImageCompareStore.getState().alignment;

    expect(alignment.snappingEnabled).toBe(DEFAULT_ALIGNMENT_STATE.snappingEnabled);
    expect(alignment.aspectRatioLocked).toBe(DEFAULT_ALIGNMENT_STATE.aspectRatioLocked);
    expect(alignment.draftTransform?.rotationDeg).toBe(0);
    expect(alignment.draftTransform?.flipX).toBe(false);
  });

  it("applies a successful estimate and keeps the manual panel available", async () => {
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: true, transform: autoTransform, confidence: 0.9, matchCount: 20 });
    await useImageCompareStore.getState().runAutoAlignment();
    const { alignment } = useImageCompareStore.getState();
    expect(alignment.appliedTransform).toEqual(autoTransform);
    expect(alignment.draftTransform).toEqual(autoTransform);
    expect(alignment.isPanelOpen).toBe(true);
    expect(alignment.status).toBe("aligned");
    expect(alignment.metadata).toMatchObject({ method: "auto", confidence: 0.9, matchCount: 20 });
  });

  it.each(["fade", "slider", "diff"] as const)("preserves the active %s comparison when aligning", async mode => {
    useImageCompareStore.getState().setCompareMode(mode);
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: true, transform: autoTransform });
    await useImageCompareStore.getState().runAutoAlignment();
    expect(useImageCompareStore.getState().compareMode).toBe(mode);
  });

  it("preserves an applied transform when a later estimate fails", async () => {
    useImageCompareStore.getState().applyAlignmentTransform(autoTransform, { method: "manual", confidence: null, matchCount: null, timestamp: 1 });
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: false });
    await useImageCompareStore.getState().runAutoAlignment();
    expect(useImageCompareStore.getState().alignment.appliedTransform).toEqual(autoTransform);
    expect(useImageCompareStore.getState().alignment.metadata?.method).toBe("manual");
    expect(useImageCompareStore.getState().alignment.status).toBe("failed");
  });

  it("opens a usable manual draft after a prompt estimate fails", async () => {
    useImageCompareStore.setState({ alignment: { ...DEFAULT_ALIGNMENT_STATE, isPromptOpen: true } });
    vi.mocked(estimateAutoAlignment).mockResolvedValue({ success: false, error: { code: "alignment/no-match", message: "No match" } });
    await useImageCompareStore.getState().runAutoAlignment();
    const { alignment } = useImageCompareStore.getState();
    expect(alignment.status).toBe("failed");
    expect(alignment.isPanelOpen).toBe(true);
    expect(alignment.isPromptOpen).toBe(false);
    expect(alignment.draftTransform).not.toBeNull();
    expect(alignment.appliedTransform).toBeNull();
  });

  it.each(["replace", "clear", "reset", "close", "options", "manual"])("cancels pending work on %s and ignores its late result", async action => {
    let finish!: (result: AutoAlignResult) => void;
    vi.mocked(estimateAutoAlignment).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = useImageCompareStore.getState().runAutoAlignment();
    const signal = vi.mocked(estimateAutoAlignment).mock.calls[0][3]!;
    const store = useImageCompareStore.getState();
    if (action === "replace") store.setModifiedImage({ ...modifiedImage, url: "blob:replacement" });
    if (action === "clear") store.clearAll();
    if (action === "reset") store.resetAlignment();
    if (action === "close") store.closeAlignmentPanel();
    if (action === "options") store.updateAlignmentOptions({ rotate: false });
    if (action === "manual") store.setAlignmentDraftTransform(autoTransform);
    expect(signal.aborted).toBe(true);
    finish({ success: true, transform: autoTransform });
    await pending;
    expect(useImageCompareStore.getState().alignment.appliedTransform).toBeNull();
    expect(useImageCompareStore.getState().alignment.status).not.toBe("aligning");
  });

  it("does not start duplicate requests", async () => {
    let finish!: (result: AutoAlignResult) => void;
    vi.mocked(estimateAutoAlignment).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const first = useImageCompareStore.getState().runAutoAlignment();
    await useImageCompareStore.getState().runAutoAlignment();
    expect(estimateAutoAlignment).toHaveBeenCalledTimes(1);
    finish({ success: false });
    await first;
  });

  it("does not start alignment when every allowed transformation is disabled", async () => {
    useImageCompareStore.getState().updateAlignmentOptions({ rotate: false, scale: false });
    await useImageCompareStore.getState().runAutoAlignment();
    expect(estimateAutoAlignment).not.toHaveBeenCalled();
    expect(useImageCompareStore.getState().alignment.status).toBe("idle");
  });

  it("allows metadata updates for the same pixels while an estimate is running", async () => {
    let finish!: (result: AutoAlignResult) => void;
    vi.mocked(estimateAutoAlignment).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = useImageCompareStore.getState().runAutoAlignment();
    useImageCompareStore.getState().setOriginalImage({ ...originalImage, exif: { Software: "Example" } });
    finish({ success: true, transform: autoTransform });
    await pending;
    expect(useImageCompareStore.getState().alignment.status).toBe("aligned");
    expect(useImageCompareStore.getState().alignment.appliedTransform).toEqual(autoTransform);
  });

  it("keeps dismissal for the current pair through reset but distinguishes replacement files", () => {
    const pairKey = getPairKey(originalImage, modifiedImage)!;
    useImageCompareStore.getState().openAlignmentPrompt(pairKey);
    useImageCompareStore.getState().skipAlignmentPrompt(pairKey);
    useImageCompareStore.getState().resetAlignment();
    expect(useImageCompareStore.getState().alignment.promptPairKey).toBe(pairKey);
    expect(useImageCompareStore.getState().alignment.skippedPairKey).toBe(pairKey);
    expect(getPairKey(originalImage, { ...modifiedImage, url: "blob:new-same-metadata" })).not.toBe(pairKey);
  });
});
