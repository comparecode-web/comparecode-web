"use client";

import { PrecisionLevel, ViewMode } from "@/types/settings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEditorStore } from "@/store/useEditorStore";
import { useCompareActions } from "@/hooks/useCompareActions";
import { originalTestText, modifiedTestText } from "@/utils/testData";
import { UI_CONSTANTS } from "@/config/constants";
import { Checkbox } from "@/components/ui/Checkbox";
import { Slider } from "@/components/ui/Slider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AVAILABLE_FONTS } from "@/config/fonts";
import { MdExpandMore, MdRestartAlt } from "react-icons/md";

export function OptionsView() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <ComparisonSection />
      <AppearanceSection />
      <LayoutSection />
      <MergeSection />
      <ActionSection />
    </div>
  );
}

function ComparisonSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Comparison</h3>
        <button
          onClick={() => resetSectionToDefaults(["ignoreWhitespace", "precision"])}
          className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
          title="Restore section defaults"
        >
          <MdRestartAlt className="text-lg" />
        </button>
      </div>
      <Checkbox
        checked={settings.ignoreWhitespace}
        onChange={(e) => updateSettings({ ignoreWhitespace: e.target.checked })}
        label="Ignore Whitespace"
      />
      <SegmentedControl<PrecisionLevel>
        options={[
          { label: "Word", value: PrecisionLevel.Word },
          { label: "Character", value: PrecisionLevel.Character }
        ]}
        value={settings.precision}
        onChange={(value) => updateSettings({ precision: value })}
        className="mt-2"
      />
    </div>
  );
}

function AppearanceSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Appearance</h3>
        <button
          onClick={() => resetSectionToDefaults(["isWordWrapEnabled", "fontSize", "fontFamily"])}
          className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
          title="Restore section defaults"
        >
          <MdRestartAlt className="text-lg" />
        </button>
      </div>
      <Checkbox
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
        <div className="relative flex items-center w-full">
          <select
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            className="appearance-none w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-1.5 text-sm outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-[var(--duration-short)]"
          >
            {AVAILABLE_FONTS.map((font) => (
              <option key={font.id} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
          <MdExpandMore className="absolute right-2 text-xl text-text-secondary pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function LayoutSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Layout</h3>
        <button
          onClick={() => resetSectionToDefaults(["viewMode"])}
          className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
          title="Restore section defaults"
        >
          <MdRestartAlt className="text-lg" />
        </button>
      </div>
      <SegmentedControl<ViewMode>
        options={[
          { label: "Split", value: ViewMode.Split },
          { label: "Unified", value: ViewMode.Unified }
        ]}
        value={settings.viewMode}
        onChange={(value) => updateSettings({ viewMode: value })}
        className="mt-1"
      />
    </div>
  );
}

function MergeSection() {
  const { settings, updateSettings, resetSectionToDefaults } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Merge</h3>
        <button
          onClick={() => resetSectionToDefaults(["isContinuousMergeEnabled"])}
          className="text-text-secondary hover:text-accent-primary transition-colors p-1 rounded hover:bg-hover-overlay"
          title="Restore section defaults"
        >
          <MdRestartAlt className="text-lg" />
        </button>
      </div>
      <Checkbox
        checked={settings.isContinuousMergeEnabled}
        onChange={(e) => updateSettings({ isContinuousMergeEnabled: e.target.checked })}
        label="Continuous merge"
        title="If enabled, merging will automatically jump to the next merge block."
        containerClassName="mt-1"
      />
    </div>
  );
}

function ActionSection() {
  const { settings, resetToDefaults } = useSettingsStore();
  const { setLeftText, setRightText } = useEditorStore();
  const { executeCompare } = useCompareActions();

  const handleLoadTestData = () => {
    setLeftText(originalTestText);
    setRightText(modifiedTestText);
    executeCompare(settings, true, false);
  };

  return (
    <div className="flex flex-col gap-3 mt-4 border-t border-border-default pt-6">
      <button
        onClick={handleLoadTestData}
        className="w-full py-2 bg-accent-primary text-white hover:bg-accent-hover rounded text-sm font-semibold transition-all shadow-sm"
      >
        Debug: TestText
      </button>
      <button
        onClick={resetToDefaults}
        className="w-full flex items-center justify-center gap-2 py-2 bg-danger-bg text-danger hover:brightness-95 rounded text-sm font-semibold transition-all border border-danger/20 mt-2"
      >
        <MdRestartAlt className="text-lg" />
        <span>Reset to defaults</span>
      </button>
    </div>
  );
}