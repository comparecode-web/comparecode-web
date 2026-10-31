"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TextFontFamilyControl, TextFontSizeControl, TextCaseSensitiveControl, TextHideUnchangedControl, TextIgnoreWhitespaceControl, TextLayoutControl, TextPrecisionControl, TextSyntaxHighlightingControl, TextSyntaxLanguageControl, TextWordWrapControl } from "./OptionsView";
import { cn } from "@/utils/uiHelpers";
import { IgnoreRulesIndicator } from "./IgnoreRulesEditor";
import { useSettingsStore } from "@/store/useSettingsStore";
import { activeIgnorePatterns } from "@/features/compare/text/services/diff/comparisonNormalizer";

export function CompactTextOptions({ disabled = false }: { disabled?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const hasActiveRules = useSettingsStore((state) => activeIgnorePatterns(state.settings.ignoreRules).length > 0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
      let usedWidth = 0;
      let count = 0;
      for (const child of Array.from(container.children)) {
        usedWidth += child.getBoundingClientRect().width + (count ? gap : 0);
        if (usedWidth > container.clientWidth) break;
        count++;
      }
      setVisibleCount(count);
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    Array.from(container.children).forEach((child) => observer.observe(child));
    update();
    return () => observer.disconnect();
  }, [hasActiveRules]);

  const controls = [
    <TextIgnoreWhitespaceControl key="whitespace" />,
    <TextCaseSensitiveControl key="case" />,
    ...(hasActiveRules ? [<IgnoreRulesIndicator key="rules" />] : []),
    <TextPrecisionControl key="precision" />,
    <TextLayoutControl key="layout" />,
    <TextHideUnchangedControl key="hide-unchanged" />,
    <TextWordWrapControl key="wrap" />,
    <div key="size" className="w-40"><TextFontSizeControl /></div>,
    <div key="font" className="w-48"><TextFontFamilyControl /></div>,
    <div key="syntax" className="flex items-center gap-3"><TextSyntaxHighlightingControl /><div className="w-36"><TextSyntaxLanguageControl /></div></div>
  ];

  return <div ref={containerRef} inert={disabled} aria-disabled={disabled} className={cn("relative flex min-w-0 flex-1 items-center gap-3 self-stretch", disabled && "opacity-50")}>
    {controls.map((control, index) => <div
      key={control.key}
      aria-hidden={index >= visibleCount}
      inert={index >= visibleCount}
      className={cn("w-max shrink-0", index >= visibleCount && "invisible absolute left-0")}
    >{control}</div>)}
  </div>;
}
