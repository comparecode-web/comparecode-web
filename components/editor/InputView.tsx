"use client";

import { MdDescription, MdSearch, MdKeyboardArrowDown } from "react-icons/md";
import { useEditorStore } from "@/store/useEditorStore";
import { useEditorUIStore } from "@/store/useEditorUIStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCompareActions } from "@/hooks/useCompareActions";

export function InputView() {
  const { leftText, rightText, setLeftText, setRightText } = useEditorStore();
  const { toggleInputPanel } = useEditorUIStore();
  const settings = useSettingsStore((state) => state.settings);
  const { executeCompare } = useCompareActions();

  const handleCompare = () => {
    if (leftText || rightText) {
      executeCompare(settings, true);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 bg-bg-secondary">
      <div className="flex items-center justify-between mb-2 px-2 gap-4">
        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MdDescription className="text-text-secondary text-lg" />
            <span className="font-bold text-text-primary text-sm">Original Text</span>
          </div>
          <button
            onClick={toggleInputPanel}
            className="flex items-center gap-1 bg-accent-primary text-white hover:bg-accent-hover shadow-sm px-3 py-1.5 rounded-md transition-colors"
            title="Hide Input Editor"
          >
            <span className="text-xs font-bold tracking-wider">Hide Input Editor</span>
            <MdKeyboardArrowDown className="text-lg" />
          </button>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <MdDescription className="text-text-secondary text-lg" />
          <span className="font-bold text-text-primary text-sm">Modified Text</span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <textarea
          value={leftText}
          onChange={(e) => setLeftText(e.target.value)}
          className="flex-1 resize-none rounded-md border border-border-default bg-bg-primary text-text-primary p-3 shadow-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-mono outline-none"
          style={{
            fontSize: `${settings.fontSize}px`,
            whiteSpace: settings.isWordWrapEnabled ? "pre-wrap" : "pre"
          }}
          spellCheck={false}
        />
        <textarea
          value={rightText}
          onChange={(e) => setRightText(e.target.value)}
          className="flex-1 resize-none rounded-md border border-border-default bg-bg-primary text-text-primary p-3 shadow-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-mono outline-none"
          style={{
            fontSize: `${settings.fontSize}px`,
            whiteSpace: settings.isWordWrapEnabled ? "pre-wrap" : "pre"
          }}
          spellCheck={false}
        />
      </div>

      <div className="flex justify-center mt-4 shrink-0">
        <button
          onClick={handleCompare}
          disabled={!leftText && !rightText}
          className="flex items-center gap-2 bg-accent-primary hover:bg-accent-hover disabled:opacity-50 disabled:bg-accent-primary disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-md font-semibold transition-colors shadow-sm"
        >
          <MdSearch className="text-xl" />
          Check it!
        </button>
      </div>
    </div>
  );
}