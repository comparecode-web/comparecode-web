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
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Comparison</h3>
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
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Appearance</h3>
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
    </div>
  );
}

function LayoutSection() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Layout</h3>
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
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Merge</h3>
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
        className="w-full py-2 bg-danger-bg text-danger hover:brightness-95 rounded text-sm font-semibold transition-all border border-danger/20 mt-2"
      >
        Reset to defaults
      </button>
    </div>
  );
}