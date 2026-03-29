"use client";

import { MdDescription, MdSearch } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { EditorTextArea } from "./EditorTextArea";

export function InputView() {
  const { leftText, rightText, setLeftText, setRightText } = useEditorStore();
  const settings = useSettingsStore((state) => state.settings);
  const { executeCompare } = useTextCompareActions();

  const isCompareDisabled = !leftText?.trim() && !rightText?.trim();

  const handleCompare = () => {
    if (!isCompareDisabled) {
      executeCompare(settings, true);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-2 sm:p-4 bg-bg-secondary">
      <div className="flex items-center justify-between mb-2 px-1 sm:px-2 gap-2 sm:gap-4">
        <div className="flex w-full sm:flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MdDescription className="text-text-secondary text-lg" />
            <span className="font-bold text-text-primary text-sm hidden sm:inline">Original Text</span>
            <span className="font-bold text-text-primary text-sm sm:hidden">Input Editor</span>
          </div>
        </div>
        <div className="items-center gap-2 flex-1 hidden sm:flex">
          <MdDescription className="text-text-secondary text-lg" />
          <span className="font-bold text-text-primary text-sm">Modified Text</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-4 min-h-0">
        <EditorTextArea
          label="Original"
          value={leftText}
          onChange={setLeftText}
          placeholder="Paste original text..."
          fontSize={settings.fontSize}
          fontFamily={settings.fontFamily}
          isWordWrapEnabled={settings.isWordWrapEnabled}
        />
        <EditorTextArea
          label="Modified"
          value={rightText}
          onChange={setRightText}
          placeholder="Paste modified text..."
          fontSize={settings.fontSize}
          fontFamily={settings.fontFamily}
          isWordWrapEnabled={settings.isWordWrapEnabled}
        />
      </div>

      <div className="flex justify-center mt-2 sm:mt-4 shrink-0">
        <button
          onClick={handleCompare}
          disabled={isCompareDisabled}
          className="flex items-center gap-2 bg-accent-primary hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-md font-semibold transition-colors shadow-sm text-sm sm:text-base"
        >
          <MdSearch className="text-xl" />
          <span className="hidden sm:inline">Check it!</span>
          <span className="sm:hidden">Compare</span>
        </button>
      </div>
    </div>
  );
}


