"use client";

import { PrecisionLevel, ViewMode } from "@/types/settings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEditorStore } from "@/store/useEditorStore";
import { useCompareActions } from "@/hooks/useCompareActions";
import { originalTestText, modifiedTestText } from "@/utils/testData";
import { UI_CONSTANTS } from "@/config/constants";
import clsx from "clsx";

export function OptionsView() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();
  const { setLeftText, setRightText } = useEditorStore();
  const { executeCompare } = useCompareActions();

  const handleLoadTestData = () => {
    setLeftText(originalTestText);
    setRightText(modifiedTestText);
    executeCompare(settings, true, false);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Comparison</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.ignoreWhitespace}
            onChange={(e) => updateSettings({ ignoreWhitespace: e.target.checked })}
            className="w-4 h-4 custom-checkbox rounded"
          />
          <span className="text-sm font-medium text-text-primary">Ignore Whitespace</span>
        </label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateSettings({ precision: PrecisionLevel.Word })}
            className={clsx(
              "flex-1 text-sm py-1.5 rounded border transition-all",
              settings.precision === PrecisionLevel.Word
                ? "bg-bg-selected border-accent-primary text-accent-primary font-semibold shadow-sm"
                : "bg-transparent border-border-default text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
            )}
          >
            Word
          </button>
          <button
            onClick={() => updateSettings({ precision: PrecisionLevel.Character })}
            className={clsx(
              "flex-1 text-sm py-1.5 rounded border transition-all",
              settings.precision === PrecisionLevel.Character
                ? "bg-bg-selected border-accent-primary text-accent-primary font-semibold shadow-sm"
                : "bg-transparent border-border-default text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
            )}
          >
            Character
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Appearance</h3>
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={settings.isWordWrapEnabled}
            onChange={(e) => updateSettings({ isWordWrapEnabled: e.target.checked })}
            className="w-4 h-4 custom-checkbox rounded"
          />
          <span className="text-sm font-medium text-text-primary">Word Wrap</span>
        </label>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-primary">Font Size</span>
            <span className="text-sm font-bold text-text-primary">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min={UI_CONSTANTS.MIN_FONT_SIZE}
            max={UI_CONSTANTS.MAX_FONT_SIZE}
            step="1"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full custom-slider"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Layout</h3>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => updateSettings({ viewMode: ViewMode.Split })}
            className={clsx(
              "flex-1 text-sm py-1.5 rounded border transition-all",
              settings.viewMode === ViewMode.Split
                ? "bg-bg-selected border-accent-primary text-accent-primary font-semibold shadow-sm"
                : "bg-transparent border-border-default text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
            )}
          >
            Split
          </button>
          <button
            onClick={() => updateSettings({ viewMode: ViewMode.Unified })}
            className={clsx(
              "flex-1 text-sm py-1.5 rounded border transition-all",
              settings.viewMode === ViewMode.Unified
                ? "bg-bg-selected border-accent-primary text-accent-primary font-semibold shadow-sm"
                : "bg-transparent border-border-default text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
            )}
          >
            Unified
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Merge</h3>
        <label
          className="flex items-center gap-2 cursor-pointer mt-1"
          title="If enabled, merging will automatically jump to the next merge block."
        >
          <input
            type="checkbox"
            checked={settings.isContinuousMergeEnabled}
            onChange={(e) => updateSettings({ isContinuousMergeEnabled: e.target.checked })}
            className="w-4 h-4 custom-checkbox rounded"
          />
          <span className="text-sm font-medium text-text-primary">Continuous merge</span>
        </label>
      </div>

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
    </div>
  );
}