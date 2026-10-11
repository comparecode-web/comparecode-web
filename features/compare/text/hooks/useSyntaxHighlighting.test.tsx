import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/config/defaults";
import { TextCompareService } from "../services/TextCompareService";
import { useSyntaxHighlighting } from "./useSyntaxHighlighting";
import * as syntax from "../services/syntax/tokenizeSyntax";

describe("comparison syntax lifecycle", () => {
  const settings = { ...defaultSettings, isSyntaxHighlightingEnabled: true };
  it("uses the compared snapshot and does not re-tokenize after selection or layout changes", () => {
    const compare = TextCompareService.compare("/*\nreturn 1;\n*/", "return 2;", settings);
    const spy = vi.spyOn(syntax, "tokenizeSyntax");
    const { result, rerender } = renderHook(({ comparison, options }) => useSyntaxHighlighting(comparison, options), {
      initialProps: { comparison: compare, options: settings }
    });
    expect(result.current.left![1].tokens[0].kind).toBe("comment");
    expect(result.current.right![0].tokens[0].kind).toBe("keyword");
    const calls = spy.mock.calls.length;
    rerender({ comparison: { ...compare, blocks: compare.blocks.map((block) => ({ ...block, isSelected: true })) }, options: { ...settings, fontSize: 20 } });
    expect(spy).toHaveBeenCalledTimes(calls);
    rerender({ comparison: compare, options: { ...settings, isSyntaxHighlightingEnabled: false } });
    expect(result.current.left).toBeNull();
    spy.mockRestore();
  });

  it("shares identical inputs and recomputes changed sources or languages", () => {
    const compare = TextCompareService.compare("return 1;", "return 1;", settings);
    const { result, rerender } = renderHook(({ comparison, options }) => useSyntaxHighlighting(comparison, options), {
      initialProps: { comparison: compare, options: settings }
    });
    expect(result.current.left).toBe(result.current.right);
    rerender({ comparison: TextCompareService.compare("return 1;", "return 2;", settings), options: settings });
    expect(result.current.left).not.toBe(result.current.right);
    expect(result.current.right![0].text).toBe("return 2;");
    rerender({ comparison: compare, options: { ...settings, textSyntaxLanguage: "plain" } });
    expect(result.current).toEqual({ left: null, right: null, limited: false });
  });
});
