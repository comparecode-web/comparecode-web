"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TextFontFamilyControl, TextFontSizeControl, TextLayoutControl, TextPrecisionControl, TextWordWrapControl } from "./OptionsView";
import { cn } from "@/utils/uiHelpers";

export function CompactTextOptions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

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
  }, []);

  const controls = [
    <TextPrecisionControl key="precision" />,
    <TextLayoutControl key="layout" />,
    <TextWordWrapControl key="wrap" />,
    <div key="size" className="w-40"><TextFontSizeControl /></div>,
    <div key="font" className="w-48"><TextFontFamilyControl /></div>
  ];

  return <div ref={containerRef} className="relative flex min-w-0 flex-1 items-center gap-3 self-stretch">
    {controls.map((control, index) => <div
      key={control.key}
      aria-hidden={index >= visibleCount}
      inert={index >= visibleCount}
      className={cn("w-max shrink-0", index >= visibleCount && "invisible absolute left-0")}
    >{control}</div>)}
  </div>;
}
