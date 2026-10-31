import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import type { VirtualItem } from "@tanstack/react-virtual";
import { CollapsedRow } from "../CollapsedRow";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import type { CollapsedRowInfo } from "@/features/compare/text/utils/unchangedRegions";

const virtualRow = { index: 0, start: 0, end: 36, size: 36, key: "row", lane: 0 } as VirtualItem;
const info = (hiddenCount: number): CollapsedRowInfo => ({
  key: "0:0", hiddenCount, oldStartLine: 1, oldEndLine: hiddenCount, newStartLine: 1, newEndLine: hiddenCount, isAtStart: true, isAtEnd: false
});

beforeEach(() => useTextUIStore.getState().resetUnchangedExpansions());

it("reveals unchanged lines step by step or all at once", async () => {
  const user = userEvent.setup();
  render(<CollapsedRow blockId="block" info={info(80)} virtualRow={virtualRow} measureRef={() => {}} />);
  await user.click(screen.getByRole("button", { name: "Show 20 more lines above" }));
  await user.click(screen.getByRole("button", { name: "Show 20 more lines below" }));
  await user.click(screen.getByRole("button", { name: "Show 20 more lines below" }));
  expect(useTextUIStore.getState().unchangedExpansions["0:0"]).toEqual({ above: 20, below: 40 });
  await user.click(screen.getByRole("button", { name: "80 unchanged lines" }));
  expect(useTextUIStore.getState().unchangedExpansions["0:0"]).toBe("all");
});

it("offers only the complete reveal for short hidden sections", () => {
  render(<CollapsedRow blockId="block" info={info(12)} virtualRow={virtualRow} measureRef={() => {}} />);
  expect(screen.queryByRole("button", { name: /more lines/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "12 unchanged lines" })).toBeInTheDocument();
});
