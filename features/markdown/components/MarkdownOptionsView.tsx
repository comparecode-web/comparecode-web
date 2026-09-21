"use client";

import { MdRestartAlt, MdEdit, MdVerticalSplit, MdPreview } from "react-icons/md";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { type MarkdownUISettingKey, useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { isMarkdownSettingsSectionDirty } from "@/features/markdown/utils/markdownSettingsReset";
import type { MarkdownViewMode } from "@/features/markdown/types/markdown";

const PREVIEW_SECTION_KEYS: Array<MarkdownUISettingKey> = ["isSyncScrollEnabled", "isWordWrapEnabled", "fontSize"];
const LAYOUT_SECTION_KEYS: Array<MarkdownUISettingKey> = ["viewMode", "editorPaneWidthPercent"];

export function MarkdownOptionsView() {
  const resetMarkdownText = useMarkdownStore((state) => state.resetMarkdownText);
  const isSyncScrollEnabled = useMarkdownUIStore((state) => state.isSyncScrollEnabled);
  const setIsSyncScrollEnabled = useMarkdownUIStore((state) => state.setIsSyncScrollEnabled);
  const isWordWrapEnabled = useMarkdownUIStore((state) => state.isWordWrapEnabled);
  const setIsWordWrapEnabled = useMarkdownUIStore((state) => state.setIsWordWrapEnabled);
  const editorPaneWidthPercent = useMarkdownUIStore((state) => state.editorPaneWidthPercent);
  const setEditorPaneWidthPercent = useMarkdownUIStore((state) => state.setEditorPaneWidthPercent);
  const viewMode = useMarkdownUIStore((state) => state.viewMode);
  const fontSize = useMarkdownUIStore((state) => state.fontSize);
  const setFontSize = useMarkdownUIStore((state) => state.setFontSize);
  const resetSectionToDefaults = useMarkdownUIStore((state) => state.resetSectionToDefaults);
  const previewSettings = { isSyncScrollEnabled, isWordWrapEnabled, fontSize, editorPaneWidthPercent, viewMode };
  const isPreviewSectionDirty = isMarkdownSettingsSectionDirty(previewSettings, PREVIEW_SECTION_KEYS);
  const isLayoutSectionDirty = isMarkdownSettingsSectionDirty(previewSettings, LAYOUT_SECTION_KEYS);

  return (
    <div className="grid gap-3 p-3 @xl/workspace:grid-cols-2 @4xl/workspace:grid-cols-3">
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
        <MarkdownLayoutControl />
        <Slider
          min={30}
          max={70}
          step="1"
          value={editorPaneWidthPercent}
          onChange={(event) => setEditorPaneWidthPercent(parseInt(event.target.value, 10))}
          label="Editor width"
          displayValue={`${Math.round(editorPaneWidthPercent)}%`}
          containerClassName={viewMode === "split" ? "mt-2" : "hidden"}
          className="cursor-col-resize"
        />
      </OptionsSection>

      <div className="mt-1 flex flex-col gap-2 pt-1">
        <Button
          variant="primary"
          size="md"
          onClick={resetMarkdownText}
          leftIcon={<MdRestartAlt className="text-lg" />}
          className="w-full"
        >
          Reset default text
        </Button>
      </div>
    </div>
  );
}

export function MarkdownLayoutControl() {
  const viewMode = useMarkdownUIStore((state) => state.viewMode);
  const setViewMode = useMarkdownUIStore((state) => state.setViewMode);
  return <SelectionBar<MarkdownViewMode>
    options={[
      { label: "Editor", value: "editor", icon: <MdEdit /> },
      { label: "Split", value: "split", icon: <MdVerticalSplit /> },
      { label: "Preview", value: "preview", icon: <MdPreview /> }
    ]}
    value={viewMode}
    onChange={setViewMode}
    className="w-auto"
    buttonClassName="px-3"
  />;
}
