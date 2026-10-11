import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/config/defaults";
import { PrecisionLevel } from "@/types/settings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextStore } from "../../../store/useTextStore";
import { useSyntaxHighlighting } from "../../../hooks/useSyntaxHighlighting";
import { SplitView } from "../SplitView";
import { UnifiedView } from "../UnifiedView";
import { LANGUAGE_SAMPLES } from "../../../services/syntax/__fixtures__/languageSamples";
import { TEXT_SYNTAX_LANGUAGES } from "@/types/settings";

vi.mock("@/features/compare/text/hooks/useDiffVirtualizer", () => ({
  useDiffVirtualizer: (count: number) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, key: index, start: index * 24 })),
    getTotalSize: () => count * 24,
    measureElement: () => {}
  })
}));

function Harness({ unified }: { unified: boolean }) {
  const comparison = useTextStore((state) => state.comparisonResult);
  const settings = useSettingsStore((state) => state.settings);
  const syntax = useSyntaxHighlighting(comparison, settings);
  return unified ? <UnifiedView syntax={syntax} /> : <SplitView syntax={syntax} />;
}

describe.each([false, true])("syntax view integration (unified: %s)", (unified) => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...defaultSettings, isSyntaxHighlightingEnabled: true }, isLoaded: true });
    useTextStore.getState().clearContent();
  });

  it.each([PrecisionLevel.Word, PrecisionLevel.Character])("uses independent source context for %s precision", (precision) => {
    const store = useTextStore.getState();
    store.setLeftText("/*\r\nreturn 1;\r\n*/\r\nconst n = 2;\r\n");
    store.setRightText("return 1;\n/*\nconst n = 3;\n*/\n");
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, precision } });
    store.compare(useSettingsStore.getState().settings);
    const { container } = render(<Harness unified={unified} />);
    const comments = Array.from(container.querySelectorAll('[data-syntax-kind="comment"]')).map((node) => node.textContent).join("");
    expect(comments).toContain("return 1;");
    expect(comments).toContain("const n = 3;");
    expect(Array.from(container.querySelectorAll('[data-syntax-kind="keyword"]')).some((node) => node.textContent === "return")).toBe(true);

    const before = container.textContent;
    act(() => { useTextStore.getState().setLeftText("completely different input"); });
    expect(container.textContent).toBe(before);
    expect(Array.from(container.querySelectorAll('[data-syntax-kind="comment"]')).map((node) => node.textContent).join("")).toBe(comments);
  });

  it("colors a wholly added source and removes syntax when disabled", () => {
    const store = useTextStore.getState();
    store.setRightText("const greeting = `Hello ${name}`;\n");
    store.compare(useSettingsStore.getState().settings);
    const { container } = render(<Harness unified={unified} />);
    expect(container.querySelector(".text-syntax-keyword")).toHaveTextContent("const");
    expect(container.querySelector(".bg-diff-added-bg")).toBeInTheDocument();
    const before = container.textContent;
    act(() => { useSettingsStore.setState({ settings: { ...defaultSettings } }); });
    expect(container.querySelector("[data-syntax-kind]")).toBeNull();
    expect(container.textContent).toBe(before);
    expect(container.querySelector(".bg-diff-added-bg")).toBeInTheDocument();
  });

  describe.each([PrecisionLevel.Word, PrecisionLevel.Character])("language rendering with %s precision", (precision) => {
    it.each(TEXT_SYNTAX_LANGUAGES.filter((language) => language !== "plain"))("renders %s sample with diff backgrounds and exact source text", (language) => {
      const { original, modified, expected } = LANGUAGE_SAMPLES[language];
      const store = useTextStore.getState();
      store.setLeftText(original);
      store.setRightText(modified);
      useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, textSyntaxLanguage: language, precision } });
      store.compare(useSettingsStore.getState().settings);
      const { container } = render(<Harness unified={unified} />);
      expect(container.querySelector("[data-syntax-kind]")).not.toBeNull();
      expect(container.querySelector(".bg-diff-added-bg")).not.toBeNull();
      expect(container.querySelector(".bg-diff-removed-bg")).not.toBeNull();
      for (const token of expected.filter(({ text }) => !["12", "12px", '"12"'].includes(text))) {
        expect(Array.from(container.querySelectorAll(`[data-syntax-kind="${token.kind}"]`)).map((node) => node.textContent)).toContain(token.text);
      }
      expect(container.querySelector("script")).toBeNull();
      const before = container.textContent;
      act(() => { useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, isSyntaxHighlightingEnabled: false } }); });
      expect(container.querySelector("[data-syntax-kind]")).toBeNull();
      expect(container.textContent).toBe(before);
    });
  });
});
