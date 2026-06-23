import { describe, expect, it } from "vitest";
import { isMarkdownSettingsSectionDirty } from "@/features/markdown/utils/markdownSettingsReset";

describe("isMarkdownSettingsSectionDirty", () => {
  it("detects default and changed markdown option sections", () => {
    expect(isMarkdownSettingsSectionDirty({
      isSyncScrollEnabled: true,
      isWordWrapEnabled: true,
      fontSize: 16,
      editorPaneWidthPercent: 50
    }, ["isSyncScrollEnabled", "fontSize"])).toBe(false);

    expect(isMarkdownSettingsSectionDirty({
      isSyncScrollEnabled: true,
      isWordWrapEnabled: true,
      fontSize: 18,
      editorPaneWidthPercent: 50
    }, ["isSyncScrollEnabled", "fontSize"])).toBe(true);
  });
});
