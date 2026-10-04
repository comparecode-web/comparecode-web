"use client";

import { MdDescription, MdFileOpen, MdSearch } from "react-icons/md";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { EditorTextArea } from "./EditorTextArea";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

interface InputViewProps {
  onImportFiles: (side: "left" | "right", files: FileList) => void;
  onOpenFile: (side: "left" | "right") => void;
}

export function InputView({ onImportFiles, onOpenFile }: InputViewProps) {
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
    <div className="flex min-h-0 flex-col w-full h-full p-2 bg-bg-secondary">
      <div className="flex items-center justify-between mb-2 px-1 sm:px-2 gap-2 sm:gap-4">
        <div className="flex w-full sm:flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MdDescription className="text-text-secondary text-lg" />
            <span className="font-bold text-text-primary text-sm hidden sm:inline">Original text</span>
            <span className="font-bold text-text-primary text-sm sm:hidden">Input editor</span>
          </div>
          <IconButton size="sm" aria-label="Import original text file" title="Import" onClick={() => onOpenFile("left")} className="hidden sm:inline-flex"><MdFileOpen /></IconButton>
        </div>
        <div className="hidden flex-1 items-center justify-between gap-2 sm:flex">
          <div className="flex items-center gap-2"><MdDescription className="text-text-secondary text-lg" /><span className="font-bold text-text-primary text-sm">Modified text</span></div>
          <IconButton size="sm" aria-label="Import modified text file" title="Import" onClick={() => onOpenFile("right")}><MdFileOpen /></IconButton>
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
          onFileDrop={(files) => onImportFiles("left", files)}
          onOpenFile={() => onOpenFile("left")}
        />
        <EditorTextArea
          label="Modified"
          value={rightText}
          onChange={setRightText}
          placeholder="Paste modified text..."
          fontSize={settings.fontSize}
          fontFamily={settings.fontFamily}
          isWordWrapEnabled={settings.isWordWrapEnabled}
          onFileDrop={(files) => onImportFiles("right", files)}
          onOpenFile={() => onOpenFile("right")}
        />
      </div>

      <div className="flex justify-center mt-2 sm:mt-4 shrink-0">
        <Button size="lg"
          onClick={handleCompare}
          disabled={isCompareDisabled}
          leftIcon={<MdSearch />}
        >
          <span className="hidden sm:inline">Check it!</span>
          <span className="sm:hidden">Compare</span>
        </Button>
      </div>
    </div>
  );
}


