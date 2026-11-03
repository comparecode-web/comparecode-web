import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceSidebar, WorkspaceSidebarProvider } from "@/components/layout/WorkspaceSidebarContext";
import { markdownEditorTabExitEvent } from "@/features/markdown/hooks/useMarkdownKeyboardShortcuts";
import { useMarkdownFullscreen } from "@/features/markdown/hooks/useMarkdownFullscreen";
import { useToastStore } from "@/store/useToastStore";

vi.mock("next/navigation", () => ({ usePathname: () => "/markdown" }));

let fullscreenElement: Element | null = null;

function setFullscreenSupport(isEnabled: boolean) {
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: isEnabled });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreenElement });
  document.documentElement.requestFullscreen = vi.fn(async () => {
    fullscreenElement = document.documentElement;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  document.exitFullscreen = vi.fn(async () => {
    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <WorkspaceSidebarProvider>{children}</WorkspaceSidebarProvider>;
}

function renderFullscreen() {
  return renderHook(() => ({ fullscreen: useMarkdownFullscreen(), workspace: useWorkspaceSidebar() }), { wrapper });
}

describe("useMarkdownFullscreen", () => {
  beforeEach(() => {
    fullscreenElement = null;
    useToastStore.setState({ activeToasts: [], queuedToasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enters document full screen with focus mode and clears both on toggle", async () => {
    setFullscreenSupport(true);
    const { result } = renderFullscreen();

    await act(async () => result.current.fullscreen.toggleFullscreen());
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    expect(result.current.fullscreen.isFullscreen).toBe(true);
    expect(result.current.workspace.isFocusMode).toBe(true);

    await act(async () => result.current.fullscreen.toggleFullscreen());
    expect(result.current.fullscreen.isFullscreen).toBe(false);
    expect(result.current.workspace.isFocusMode).toBe(false);
  });

  it("ends focus mode when the browser leaves full screen without a key event", async () => {
    setFullscreenSupport(true);
    const { result } = renderFullscreen();
    const armTabExit = vi.fn();
    window.addEventListener(markdownEditorTabExitEvent, armTabExit);

    await act(async () => result.current.fullscreen.toggleFullscreen());
    act(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current.fullscreen.isFullscreen).toBe(false);
    expect(result.current.workspace.isFocusMode).toBe(false);
    expect(armTabExit).toHaveBeenCalledTimes(1);
    window.removeEventListener(markdownEditorTabExitEvent, armTabExit);
  });

  it("ignores full screen changes from sessions it did not start", async () => {
    setFullscreenSupport(true);
    const { result } = renderFullscreen();

    act(() => {
      fullscreenElement = document.body;
      document.dispatchEvent(new Event("fullscreenchange"));
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current.fullscreen.isFullscreen).toBe(false);
    expect(result.current.workspace.isFocusMode).toBe(false);
  });

  it("falls back to an expanded view that Escape closes", async () => {
    setFullscreenSupport(false);
    const { result } = renderFullscreen();

    await act(async () => result.current.fullscreen.toggleFullscreen());
    expect(result.current.fullscreen.isFullscreen).toBe(true);
    expect(result.current.workspace.isFocusMode).toBe(true);
    expect(useToastStore.getState().activeToasts[0]?.message).toMatch(/expanded/);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.fullscreen.isFullscreen).toBe(false);
    expect(result.current.workspace.isFocusMode).toBe(false);
  });

  it("keeps the expanded view when another control consumed Escape", async () => {
    setFullscreenSupport(false);
    const { result } = renderFullscreen();

    await act(async () => result.current.fullscreen.toggleFullscreen());
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
      event.preventDefault();
      document.dispatchEvent(event);
    });

    expect(result.current.fullscreen.isFullscreen).toBe(true);
  });

  it("leaves full screen and focus mode on unmount", async () => {
    setFullscreenSupport(true);
    const { result, unmount } = renderFullscreen();

    await act(async () => result.current.fullscreen.toggleFullscreen());
    unmount();

    expect(document.exitFullscreen).toHaveBeenCalled();
  });
});
