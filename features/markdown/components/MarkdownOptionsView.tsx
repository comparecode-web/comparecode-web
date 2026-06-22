"use client";

import { MdRestartAlt } from "react-icons/md";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

export function MarkdownOptionsView() {
  const resetMarkdownText = useMarkdownStore((state) => state.resetMarkdownText);
  const isSyncScrollEnabled = useMarkdownUIStore((state) => state.isSyncScrollEnabled);
  const setIsSyncScrollEnabled = useMarkdownUIStore((state) => state.setIsSyncScrollEnabled);
  const isWordWrapEnabled = useMarkdownUIStore((state) => state.isWordWrapEnabled);
  const setIsWordWrapEnabled = useMarkdownUIStore((state) => state.setIsWordWrapEnabled);
  const editorPaneWidthPercent = useMarkdownUIStore((state) => state.editorPaneWidthPercent);
  const setEditorPaneWidthPercent = useMarkdownUIStore((state) => state.setEditorPaneWidthPercent);
  const fontSize = useMarkdownUIStore((state) => state.fontSize);
  const setFontSize = useMarkdownUIStore((state) => state.setFontSize);

  return (
    <div className="flex min-h-full flex-col gap-2 bg-hover-overlay p-2">
      <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-secondary p-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Preview</h3>
        <Switch
          checked={isSyncScrollEnabled}
          onChange={(event) => setIsSyncScrollEnabled(event.target.checked)}
          label="Sync scrolling"
        />
        <Switch
          checked={isWordWrapEnabled}
          onChange={(event) => setIsWordWrapEnabled(event.target.checked)}
          label="Word wrap"
        />
        <Slider
          min={12}
          max={24}
          step="1"
          value={fontSize}
          onChange={(event) => setFontSize(parseInt(event.target.value, 10))}
          label="Font size"
          displayValue={`${fontSize}px`}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-secondary p-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Layout</h3>
        <Slider
          min={30}
          max={70}
          step="1"
          value={editorPaneWidthPercent}
          onChange={(event) => setEditorPaneWidthPercent(parseInt(event.target.value, 10))}
          label="Editor width"
          displayValue={`${Math.round(editorPaneWidthPercent)}%`}
        />
      </div>

      <div className="mt-1 flex flex-col gap-2 pt-1">
        <Button
          variant="danger"
          size="md"
          onClick={resetMarkdownText}
          leftIcon={<MdRestartAlt className="text-lg" />}
          className="w-full"
        >
          Reset markdown
        </Button>
      </div>
    </div>
  );
}
