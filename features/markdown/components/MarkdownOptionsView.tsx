"use client";

import { MdRestartAlt } from "react-icons/md";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { type MarkdownUISettingKey, useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { isMarkdownSettingsSectionDirty } from "@/features/markdown/utils/markdownSettingsReset";

const PREVIEW_SECTION_KEYS: Array<MarkdownUISettingKey> = ["isSyncScrollEnabled", "isWordWrapEnabled", "fontSize"];
const LAYOUT_SECTION_KEYS: Array<MarkdownUISettingKey> = ["editorPaneWidthPercent"];

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
  const resetSectionToDefaults = useMarkdownUIStore((state) => state.resetSectionToDefaults);
  const previewSettings = { isSyncScrollEnabled, isWordWrapEnabled, fontSize, editorPaneWidthPercent };
  const isPreviewSectionDirty = isMarkdownSettingsSectionDirty(previewSettings, PREVIEW_SECTION_KEYS);
  const isLayoutSectionDirty = isMarkdownSettingsSectionDirty(previewSettings, LAYOUT_SECTION_KEYS);

  return (
    <div className="flex min-h-full flex-col gap-2 bg-hover-overlay p-2">
      <OptionsSection
        title="Preview"
        isDirty={isPreviewSectionDirty}
        onReset={() => resetSectionToDefaults(PREVIEW_SECTION_KEYS)}
      >
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
      </OptionsSection>

      <OptionsSection
        title="Layout"
        isDirty={isLayoutSectionDirty}
        onReset={() => resetSectionToDefaults(LAYOUT_SECTION_KEYS)}
      >
        <Slider
          min={30}
          max={70}
          step="1"
          value={editorPaneWidthPercent}
          onChange={(event) => setEditorPaneWidthPercent(parseInt(event.target.value, 10))}
          label="Editor width"
          displayValue={`${Math.round(editorPaneWidthPercent)}%`}
        />
      </OptionsSection>

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
