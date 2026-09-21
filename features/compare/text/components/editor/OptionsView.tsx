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
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { MdTextFields, MdTitle, MdVerticalSplit, MdViewAgenda } from "react-icons/md";

const COMPARISON_SECTION_KEYS: Array<keyof AppSettings> = ["ignoreWhitespace", "precision"];
const APPEARANCE_SECTION_KEYS: Array<keyof AppSettings> = ["isWordWrapEnabled", "fontSize", "fontFamily"];
const LAYOUT_SECTION_KEYS: Array<keyof AppSettings> = ["viewMode"];
const MERGE_SECTION_KEYS: Array<keyof AppSettings> = ["isContinuousMergeEnabled"];
const BUTTON_VISIBILITY_SECTION_KEYS: Array<keyof AppSettings> = ["isJumpButtonsVisible", "isMergeJumpButtonsVisible"];

export function OptionsView() {
  return (
    <div className="grid items-start gap-3 p-3 @xl/workspace:grid-cols-2 @4xl/workspace:grid-cols-3">
      <div className="min-w-0 space-y-3">
        <ComparisonSection />
        <LayoutSection />
      </div>
      <AppearanceSection />
      <div className="min-w-0 space-y-3">
        <MergeSection />
        <ButtonVisibilitySection />
      </div>
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
        label="Ignore whitespace"
      />
      <TextPrecisionControl />
    </OptionsSection>
  );
}

export function TextPrecisionControl() {
  const { settings, updateSettings } = useSettingsStore();
  return <SelectionBar<PrecisionLevel>
        options={[
          { label: "Word", value: PrecisionLevel.Word, icon: <MdTextFields /> },
          { label: "Character", value: PrecisionLevel.Character, icon: <MdTitle /> }
        ]}
        value={settings.precision}
        onChange={(value) => updateSettings({ precision: value })}
        className="w-auto"
        buttonClassName="px-3"
      />;
}

function AppearanceSection() {
  const { settings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, APPEARANCE_SECTION_KEYS);

  return (
    <OptionsSection
      title="Appearance"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(APPEARANCE_SECTION_KEYS)}
    >
      <TextWordWrapControl />
      <TextFontSizeControl />
      <div className="flex flex-col gap-1"><span className="text-sm font-medium text-text-primary">Font family</span><TextFontFamilyControl /></div>
    </OptionsSection>
  );
}

export function TextWordWrapControl() {
  const { settings, updateSettings } = useSettingsStore();
  return <Switch checked={settings.isWordWrapEnabled} onChange={(event) => updateSettings({ isWordWrapEnabled: event.target.checked })} label="Word wrap" />;
}

export function TextFontSizeControl() {
  const { settings, updateSettings } = useSettingsStore();
  return <Slider min={UI_CONSTANTS.MIN_FONT_SIZE} max={UI_CONSTANTS.MAX_FONT_SIZE} step="1"
    value={settings.fontSize} onChange={(event) => updateSettings({ fontSize: parseInt(event.target.value, 10) })}
    label="Font size" displayValue={`${settings.fontSize}px`} />;
}

export function TextFontFamilyControl() {
  const { settings, updateSettings } = useSettingsStore();
  return <SelectDropdown label="Font family" value={settings.fontFamily}
    onChange={(value) => updateSettings({ fontFamily: value })}
    options={AVAILABLE_FONTS.map((font) => ({ value: font.value, label: font.name }))}
    triggerClassName="py-1.5 whitespace-nowrap" />;
}

function LayoutSection() {
  const { settings, resetSectionToDefaults } = useSettingsStore();
  const isSectionDirty = isSettingsSectionDirty(settings, LAYOUT_SECTION_KEYS);

  return (
    <OptionsSection
      title="Layout"
      isDirty={isSectionDirty}
      onReset={() => resetSectionToDefaults(LAYOUT_SECTION_KEYS)}
    >
      <TextLayoutControl />
    </OptionsSection>
  );
}

export function TextLayoutControl() {
  const { settings, updateSettings } = useSettingsStore();
  return <SelectionBar<ViewMode>
        options={[
          { label: "Split", value: ViewMode.Split, icon: <MdVerticalSplit /> },
          { label: "Unified", value: ViewMode.Unified, icon: <MdViewAgenda /> }
        ]}
        value={settings.viewMode}
        onChange={(value) => updateSettings({ viewMode: value })}
        className="w-auto"
        buttonClassName="px-3"
      />;
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
  const showTextTest = useTextUIStore((state) => state.showTextTest);
  const setShowTextTest = useTextUIStore((state) => state.setShowTextTest);
  const isSectionDirty = isSettingsSectionDirty(settings, BUTTON_VISIBILITY_SECTION_KEYS) || !showTextTest;

  return (
    <OptionsSection
      title="Button visibility"
      isDirty={isSectionDirty}
      onReset={() => { resetSectionToDefaults(BUTTON_VISIBILITY_SECTION_KEYS); setShowTextTest(true); }}
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
      <Switch label="Show text test" checked={showTextTest} onChange={(event) => setShowTextTest(event.target.checked)} />
    </OptionsSection>
  );
}

export function TextTestButton() {
  const settings = useSettingsStore((state) => state.settings);
  const { setLeftText, setRightText } = useEditorStore();
  const { executeCompare } = useTextCompareActions();

  const handleLoadTestData = () => {
    setLeftText(originalTestText);
    setRightText(modifiedTestText);
    executeCompare(settings, true, false);
  };

  return (
      <Button size="sm" variant="primary" className="shrink-0 whitespace-nowrap"
        onClick={handleLoadTestData}
      >
        Test text
      </Button>
  );
}


