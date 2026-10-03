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
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    expect(exit.cancel).toHaveBeenCalled();
    act(() => animations.slice(-2).forEach(animation => animation.onfinish?.()));
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
});
