"use client";

import { type AppSettings, PrecisionLevel, ViewMode } from "@/types/settings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useTextCompareActions } from "@/features/compare/text/hooks/useTextCompareActions";
import { originalTestText, modifiedTestText } from "@/utils/testData";
import { UI_CONSTANTS } from "@/config/constants";
import { Switch } from "@/components/ui/Switch";
import { Slider } from "@/components/ui/Slider";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { Button } from "@/components/ui/Button";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { AVAILABLE_FONTS } from "@/config/fonts";
import { isSettingsSectionDirty } from "@/utils/settingsReset";
import { MdRestartAlt } from "react-icons/md";

const COMPARISON_SECTION_KEYS: Array<keyof AppSettings> = ["ignoreWhitespace", "precision"];
const APPEARANCE_SECTION_KEYS: Array<keyof AppSettings> = ["isWordWrapEnabled", "fontSize", "fontFamily"];
const LAYOUT_SECTION_KEYS: Array<keyof AppSettings> = ["viewMode"];
const MERGE_SECTION_KEYS: Array<keyof AppSettings> = ["isContinuousMergeEnabled"];
const BUTTON_VISIBILITY_SECTION_KEYS: Array<keyof AppSettings> = ["isJumpButtonsVisible", "isMergeJumpButtonsVisible"];

export function OptionsView() {
  return (
    <div className="flex min-h-full flex-col gap-2 bg-hover-overlay p-2">
      <ComparisonSection />
      <AppearanceSection />
      <LayoutSection />
      <MergeSection />
      <ButtonVisibilitySection />
      <ActionSection />
    </div>
  );
}

function ComparisonSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, COMPARISON_SECTION_KEYS);

  return (
    <OptionsSection
      title="Comparison"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(COMPARISON_SECTION_KEYS)}
    >
      <Switch
        checked={settings.ignoreWhitespace}
        onChange={(e) => updateSettings({ ignoreWhitespace: e.target.checked })}
        label="Ignore Whitespace"
      />
      <SelectionBar<PrecisionLevel>
        options={[
          { label: "Word", value: PrecisionLevel.Word },
          { label: "Character", value: PrecisionLevel.Character }
        ]}
        value={settings.precision}
        onChange={(value) => updateSettings({ precision: value })}
        className="mt-2"
      />
    </OptionsSection>
  );
}

function AppearanceSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, APPEARANCE_SECTION_KEYS);

  return (
    <OptionsSection
      title="Appearance"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(APPEARANCE_SECTION_KEYS)}
    >
      <Switch
        checked={settings.isWordWrapEnabled}
        onChange={(e) => updateSettings({ isWordWrapEnabled: e.target.checked })}
        label="Word Wrap"
        containerClassName="mt-1"
      />
      <Slider
        min={UI_CONSTANTS.MIN_FONT_SIZE}
        max={UI_CONSTANTS.MAX_FONT_SIZE}
        step="1"
        value={settings.fontSize}
        onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value, 10) })}
        label="Font Size"
        displayValue={`${settings.fontSize}px`}
        containerClassName="mt-2"
      />
      <div className="flex flex-col gap-1 mt-1">
        <span className="text-sm font-medium text-text-primary">Font Family</span>
        <SelectDropdown
          value={settings.fontFamily}
          onChange={(value) => updateSettings({ fontFamily: value })}
          options={AVAILABLE_FONTS.map((font) => ({ value: font.value, label: font.name }))}
          triggerClassName="py-1.5"
        />
      </div>
    </OptionsSection>
  );
}

function LayoutSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, LAYOUT_SECTION_KEYS);

  return (
    <OptionsSection
      title="Layout"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(LAYOUT_SECTION_KEYS)}
    >
      <SelectionBar<ViewMode>
        options={[
          { label: "Split", value: ViewMode.Split },
          { label: "Unified", value: ViewMode.Unified }
        ]}
        value={settings.viewMode}
        onChange={(value) => updateSettings({ viewMode: value })}
        className="mt-1"
      />
    </OptionsSection>
  );
}

function MergeSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, MERGE_SECTION_KEYS);

  return (
    <OptionsSection
      title="Merge"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(MERGE_SECTION_KEYS)}
    >
      <Switch
        checked={settings.isContinuousMergeEnabled}
        onChange={(e) => updateSettings({ isContinuousMergeEnabled: e.target.checked })}
        label="Continuous merge"
        title="If enabled, merging will automatically jump to the next merge block."
        containerClassName="mt-1"
      />
    </OptionsSection>
  );
}

function ButtonVisibilitySection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, BUTTON_VISIBILITY_SECTION_KEYS);

  return (
    <OptionsSection
      title="Button visibility"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(BUTTON_VISIBILITY_SECTION_KEYS)}
    >
      <Switch
        checked={settings.isJumpButtonsVisible}
        onChange={(e) => updateSettings({ isJumpButtonsVisible: e.target.checked })}
        label="Jump to top/bottom"
        title="Shows floating jump buttons in the diff view so you can quickly jump to the top and bottom."
        containerClassName="mt-1"
      />
      <Switch
        checked={settings.isMergeJumpButtonsVisible}
        onChange={(e) => updateSettings({ isMergeJumpButtonsVisible: e.target.checked })}
        label="Jump to next/previous"
        title="Shows floating merge jump buttons in the top-right corner so you can quickly jump to previous or next merge block."
      />
    </OptionsSection>
  );
}

function ActionSection() {
  const { settings, resetToDefaults } = useSettingsStore();
  const { setLeftText, setRightText } = useEditorStore();
  const { executeCompare } = useTextCompareActions();

  const handleLoadTestData = () => {
    setLeftText(originalTestText);
    setRightText(modifiedTestText);
    executeCompare(settings, true, false);
  };

  return (
    <div className="mt-1 flex flex-col gap-1 pt-1">
      <button
        onClick={handleLoadTestData}
        className="w-full py-2 bg-accent-primary text-white hover:bg-accent-hover rounded text-sm font-semibold transition-all shadow-sm"
      >
        Test text
      </button>
      <Button
        variant="danger"
        size="md"
        onClick={resetToDefaults}
        leftIcon={<MdRestartAlt className="text-lg" />}
        className="mt-2 w-full"
      >
        Reset to defaults
      </Button>
    </div>
  );
}


