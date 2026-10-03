import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedHistoryList } from "../AnimatedHistoryList";
import type { DiffHistoryItem } from "@/types/history";

const items: DiffHistoryItem[] = ["one", "two"].map(id => ({ id, originalText: id, modifiedText: id, createdAt: "2026-10-03", isBookmarked: false }));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("history motion", () => {
  it("reorders keyed cards and removes them immediately with reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[items[1], items[0]]}>{content}</AnimatedHistoryList>);
    expect(screen.getAllByRole("button").map(node => node.textContent)).toEqual(["two", "one"]);
    rerender(<AnimatedHistoryList items={[]}>{content}</AnimatedHistoryList>);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("cancels an exit when its card reappears before the animation finishes", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animations: Array<{ cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: vi.fn(() => { const animation = { cancel: vi.fn(), onfinish: null }; animations.push(animation); return animation; }) });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender, unmount } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[items[0]]}>{content}</AnimatedHistoryList>);
    const exit = animations.at(-1)!;
    const beforeReturn = animations.length;
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    expect(exit.cancel).toHaveBeenCalled();
    act(() => animations.slice(beforeReturn).forEach(animation => animation.onfinish?.()));
    expect(screen.getAllByRole("button")).toHaveLength(2);
    unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });
  it("does not restart remaining exits when another exit finishes", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animations: Array<{ cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
    const animate = vi.fn(() => {
      const animation = { cancel: vi.fn(), onfinish: null };
      animations.push(animation);
      return animation;
    });
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender, unmount } = render(<AnimatedHistoryList items={items} empty={<p>Empty</p>}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[]} empty={<p>Empty</p>}>{content}</AnimatedHistoryList>);
    const exits = animations.slice(-2);
    const callCount = animate.mock.calls.length;
    act(() => exits[0].onfinish?.());
    expect(animate).toHaveBeenCalledTimes(callCount);
    expect(exits[1].cancel).not.toHaveBeenCalled();
    act(() => exits[1].onfinish?.());
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });
  it("replays distinct entrances on style changes and honors preview speed", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender, unmount } = render(<AnimatedHistoryList items={items} motion="fade">{content}</AnimatedHistoryList>);
    try {
      animate.mockClear();
      rerender(<AnimatedHistoryList items={items} motion="scale" playbackRate={.5}>{content}</AnimatedHistoryList>);
      expect(animate).toHaveBeenCalledTimes(2);
      expect(animate).toHaveBeenCalledWith([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], expect.anything());
      expect(animate.mock.results[0].value.playbackRate).toBe(.5);
      animate.mockClear();
      rerender(<AnimatedHistoryList items={items} motion="scale" playbackRate={.5} replayKey={1}>{content}</AnimatedHistoryList>);
      expect(animate).toHaveBeenCalledTimes(2);
    } finally {
      unmount();
      Reflect.deleteProperty(HTMLElement.prototype, "animate");
    }
  });
  it("keeps completed exits transparent until React removes their nodes", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { container, rerender, unmount } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    try {
      expect(animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 560, easing: "cubic-bezier(.2,1.4,.35,1)" }));
      expect(animate.mock.results[0].value.playbackRate).toBe(1);
      animate.mockClear();
      rerender(<AnimatedHistoryList items={[]}>{content}</AnimatedHistoryList>);
      expect(animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ fill: "both" }));
      const nodes = container.querySelectorAll<HTMLElement>("[data-history-id]");
      for (const node of nodes) expect(node.style.opacity).toBe("0");
      act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
      expect(container.querySelector("[data-history-id]")).toBeNull();
      rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
      for (const node of container.querySelectorAll<HTMLElement>("[data-history-id]")) expect(node.style.opacity).toBe("");
    } finally {
      unmount();
      Reflect.deleteProperty(HTMLElement.prototype, "animate");
    }
  });
});
