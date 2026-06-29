import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryView } from "@/components/history/HistoryView";
import { defaultSettings } from "@/config/defaults";
import type { DiffHistoryItem } from "@/types/history";

const historyStoreMock = vi.hoisted(() => ({
  items: [] as Array<DiffHistoryItem>,
  loadHistory: vi.fn(),
  deleteItem: vi.fn(),
  deleteAll: vi.fn(),
  toggleBookmark: vi.fn()
}));

const routerMock = vi.hoisted(() => ({
  push: vi.fn()
}));

const restoreMocks = vi.hoisted(() => ({
  restoreTextHistoryItem: vi.fn(),
  restoreImageHistoryItem: vi.fn()
}));

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [vi.fn(), vi.fn()]
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock
}));

vi.mock("@/store/useHistoryStore", () => ({
  useHistoryStore: () => historyStoreMock
}));

vi.mock("@/store/useSettingsStore", () => ({
  useSettingsStore: (selector: (state: { settings: typeof defaultSettings }) => unknown) => selector({ settings: defaultSettings })
}));

vi.mock("@/hooks/useLiveTimeTicker", () => ({
  useLiveTimeTicker: () => new Date("2026-06-29T12:00:00.000Z").getTime()
}));

vi.mock("@/features/compare/text", () => ({
  useTextHistoryRestore: () => ({
    restoreTextHistoryItem: restoreMocks.restoreTextHistoryItem
  })
}));

vi.mock("@/features/compare/image", () => ({
  useImageHistoryRestore: () => ({
    restoreImageHistoryItem: restoreMocks.restoreImageHistoryItem
  })
}));

vi.mock("@/components/history/HistoryItemCard", () => ({
  HistoryItemCard: ({ item, onRestore }: { item: DiffHistoryItem; onRestore: (item: DiffHistoryItem) => void }) => {
    const mode = item.snapshot?.mode ?? item.compareMode ?? "text";

    return (
      <button type="button" onClick={() => onRestore(item)}>
        {item.id} {mode}
      </button>
    );
  }
}));

function createTextItem(id: string, isBookmarked = false): DiffHistoryItem {
  return {
    id,
    compareMode: "text",
    snapshot: {
      mode: "text",
      originalText: `${id} original`,
      modifiedText: `${id} modified`
    },
    originalText: `${id} original`,
    modifiedText: `${id} modified`,
    createdAt: "2026-06-29T10:00:00.000Z",
    isBookmarked
  };
}

function createImageItem(id: string, isBookmarked = false): DiffHistoryItem {
  return {
    id,
    compareMode: "image",
    snapshot: {
      mode: "image",
      originalImageUrl: `${id}-original.png`,
      modifiedImageUrl: `${id}-modified.png`
    },
    originalText: "",
    modifiedText: "",
    createdAt: "2026-06-29T11:00:00.000Z",
    isBookmarked
  };
}

describe("HistoryView", () => {
  beforeEach(() => {
    historyStoreMock.items = [];
    historyStoreMock.loadHistory = vi.fn();
    historyStoreMock.deleteItem = vi.fn();
    historyStoreMock.deleteAll = vi.fn();
    historyStoreMock.toggleBookmark = vi.fn();
    routerMock.push = vi.fn();
    restoreMocks.restoreTextHistoryItem = vi.fn();
    restoreMocks.restoreImageHistoryItem = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows all history items by default", () => {
    historyStoreMock.items = [createTextItem("text-1"), createImageItem("image-1")];

    render(<HistoryView />);

    expect(screen.getByText("text-1 text")).toBeInTheDocument();
    expect(screen.getByText("image-1 image")).toBeInTheDocument();
    expect(screen.getByText("Text: 1")).toBeInTheDocument();
    expect(screen.getByText("Image: 1")).toBeInTheDocument();
    expect(screen.getByText("Filter:")).toBeInTheDocument();
  });

  it("filters text compare history items", async () => {
    const user = userEvent.setup();
    historyStoreMock.items = [createTextItem("text-1", true), createImageItem("image-1")];

    render(<HistoryView />);

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("option", { name: "Text compare" }));

    expect(screen.getByText("text-1 text")).toBeInTheDocument();
    expect(screen.queryByText("image-1 image")).not.toBeInTheDocument();
    expect(screen.getByText("Text: 1")).toBeInTheDocument();
    expect(screen.getByText("Image: 1")).toBeInTheDocument();
    expect(screen.getByText("Bookmarked: 1")).toBeInTheDocument();
  });

  it("shows a filtered empty state when there are no matching items", async () => {
    const user = userEvent.setup();
    historyStoreMock.items = [createTextItem("text-1")];

    render(<HistoryView />);

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("option", { name: "Image compare" }));

    expect(screen.getByText("No matching history items")).toBeInTheDocument();
    expect(screen.getByText("Try switching the history filter to All.")).toBeInTheDocument();
    expect(screen.queryByText("text-1 text")).not.toBeInTheDocument();
  });

  it("keeps Delete All scoped to the whole history database", async () => {
    const user = userEvent.setup();
    historyStoreMock.items = [createTextItem("text-1"), createImageItem("image-1")];

    render(<HistoryView />);

    await user.click(screen.getByRole("button", { name: "Delete All" }));

    expect(window.confirm).toHaveBeenCalledWith("You are about to delete the whole history database, including items hidden by the current filter. Are you sure?");
    await waitFor(() => {
      expect(historyStoreMock.deleteAll).toHaveBeenCalledTimes(1);
    });
  });

  it("restores image history items to the image page", async () => {
    const user = userEvent.setup();
    const imageItem = createImageItem("image-1");
    historyStoreMock.items = [imageItem];

    render(<HistoryView />);

    await user.click(screen.getByRole("button", { name: "image-1 image" }));

    expect(restoreMocks.restoreImageHistoryItem).toHaveBeenCalledWith(imageItem);
    expect(routerMock.push).toHaveBeenCalledWith("/image");
  });
});
