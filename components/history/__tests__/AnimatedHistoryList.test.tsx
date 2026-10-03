import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedHistoryList } from "../AnimatedHistoryList";
import type { DiffHistoryItem } from "@/types/history";

const items: DiffHistoryItem[] = ["one", "two"].map(id => ({ id, originalText: id, modifiedText: id, createdAt: "2026-10-03", isBookmarked: false }));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); Reflect.deleteProperty(HTMLElement.prototype, "animate"); });
describe("history motion", () => {
  it("reorders keyed cards and removes them without animation with reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[items[1], items[0]]}>{content}</AnimatedHistoryList>);
    expect(screen.getAllByRole("button").map(node => node.textContent)).toEqual(["two", "one"]);
    rerender(<AnimatedHistoryList items={[]}>{content}</AnimatedHistoryList>);
    await waitFor(() => expect(screen.queryByRole("button")).toBeNull());
  });
  it("cancels an exit when its card reappears before the animation finishes", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animations: Array<{ cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: vi.fn(() => { const animation = { cancel: vi.fn(), onfinish: null }; animations.push(animation); return animation; }) });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender, unmount } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[items[0]]}>{content}</AnimatedHistoryList>);
    const exit = animations.at(-1)!;
    const queuedFinish = exit.onfinish;
    const beforeReturn = animations.length;
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    expect(exit.cancel).toHaveBeenCalled();
    act(() => queuedFinish?.());
    expect(screen.getAllByRole("button")).toHaveLength(2);
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
  it("slides long reversed lists continuously without fading or shortening their path", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.historyId ? Array.from(this.parentElement!.children).indexOf(this) * 180 : 0;
    });
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const many = Array.from({ length: 56 }, (_, i) => ({ ...items[0], id: String(i) }));
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={many}>{content}</AnimatedHistoryList>);
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    animate.mockClear();
    rerender(<AnimatedHistoryList items={[...many].reverse()}>{content}</AnimatedHistoryList>);
    expect(screen.getAllByRole("button").map(node => node.textContent)).toEqual(many.map(item => item.id).reverse());
    expect(animate).toHaveBeenCalled();
    for (const call of animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][]) {
      expect(call[0]).toHaveLength(2);
      expect(call[0].every(frame => frame.opacity === 1)).toBe(true);
      const distance = Math.abs(Number(String(call[0][0].transform).match(/, (-?[\d.]+)px/)![1]));
      expect(distance).toBeGreaterThan(8000);
      expect(call[1].duration).toBe(560);
      expect(call[1].delay).toBe(0);
    }
    expect(animate.mock.calls.length).toBeLessThan(many.length);
  });
  it("continues an interrupted move from its visible position and opacity", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("DOMMatrixReadOnly", class { m41 = 0; m42 = 40; });
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.historyId ? Array.from(this.parentElement!.children).indexOf(this) * 100 : 0;
    });
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    rerender(<AnimatedHistoryList items={[...items].reverse()}>{content}</AnimatedHistoryList>);
    const previous = animate.mock.results.at(-1)!.value;
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ transform: "matrix(1, 0, 0, 1, 0, 40)", opacity: ".4" } as CSSStyleDeclaration);
    animate.mockClear();
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    expect(previous.cancel).toHaveBeenCalled();
    expect(previous.onfinish).toBeNull();
    expect(animate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ opacity: .4, transform: "translate(0px, 140px)" })
    ]), expect.anything());
  });
  it.each([240, 241, 10_000])("preserves the entire movement and opacity at any distance (%i px)", distance => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.historyId ? Array.from(this.parentElement!.children).indexOf(this) * distance : 0;
    });
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    animate.mockClear();
    rerender(<AnimatedHistoryList items={[...items].reverse()}>{content}</AnimatedHistoryList>);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ opacity: 1, transform: `translate(0px, ${distance}px)` })
    ]), expect.objectContaining({ duration: 560, easing: expect.stringMatching(/^cubic-bezier\(/) }));
  });
  it("restores all returning rows to flow before measuring their destinations", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      if (!this.dataset.historyId) return 0;
      if (this.style.position === "absolute") return Number.parseFloat(this.style.top);
      return Array.from(this.parentElement!.children).filter(node => (node as HTMLElement).style.position !== "absolute").indexOf(this) * 100;
    });
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    rerender(<AnimatedHistoryList items={[items[1]]}>{content}</AnimatedHistoryList>);
    animate.mockClear();
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    expect(animate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ transform: "translate(0px, -100px)" })
    ]), expect.anything());
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
  it("handles repeated filter reversals, empty lists and unmount without stale exit callbacks", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null as (() => void) | null, playbackRate: 1 }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender, unmount } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    for (let i = 0; i < 100; i++) {
      rerender(<AnimatedHistoryList items={i % 2 ? items : []}>{content}</AnimatedHistoryList>);
    }
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    expect(screen.getAllByRole("button").map(node => node.textContent)).toEqual(["one", "two"]);
    rerender(<AnimatedHistoryList items={[]} empty={<p>Empty</p>}>{content}</AnimatedHistoryList>);
    act(() => animate.mock.results.forEach(result => result.value.onfinish?.()));
    expect(screen.getByText("Empty")).toBeInTheDocument();
    rerender(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    const pending = animate.mock.results.slice(-2).map(result => result.value);
    unmount();
    for (const animation of pending) {
      expect(animation.cancel).toHaveBeenCalled();
      expect(animation.onfinish).toBeNull();
    }
  });
  it("removes exits without animation when the animation API is unavailable", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const content = (item: DiffHistoryItem) => <button>{item.id}</button>;
    const { rerender } = render(<AnimatedHistoryList items={items}>{content}</AnimatedHistoryList>);
    rerender(<AnimatedHistoryList items={[]} empty={<p>Empty</p>}>{content}</AnimatedHistoryList>);
    await waitFor(() => expect(screen.getByText("Empty")).toBeInTheDocument());
    expect(screen.queryByRole("button")).toBeNull();
  });
});
