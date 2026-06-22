import { create } from "zustand";
import { loadMarkdownUIState, saveMarkdownUIState } from "@/features/markdown/services/markdownStorage";

export const defaultMarkdownUISettings = {
  isSyncScrollEnabled: true,
  editorPaneWidthPercent: 50,
  isWordWrapEnabled: true,
  fontSize: 16
};

export type MarkdownUISettingKey = keyof typeof defaultMarkdownUISettings;

interface MarkdownUIState {
  isLoaded: boolean;
  isOptionsPanelOpen: boolean;
  isSyncScrollEnabled: boolean;
  editorPaneWidthPercent: number;
  isWordWrapEnabled: boolean;
  fontSize: number;
  setIsOptionsPanelOpen: (value: boolean) => void;
  setIsSyncScrollEnabled: (value: boolean) => void;
  setEditorPaneWidthPercent: (value: number) => void;
  setIsWordWrapEnabled: (value: boolean) => void;
  setFontSize: (value: number) => void;
  resetSectionToDefaults: (keys: Array<MarkdownUISettingKey>) => void;
  loadPersistedMarkdownUIState: () => void;
}

function persistPartial(state: Pick<MarkdownUIState, "editorPaneWidthPercent" | "isSyncScrollEnabled" | "fontSize">): void {
  saveMarkdownUIState({
    editorPaneWidthPercent: state.editorPaneWidthPercent,
    isSyncScrollEnabled: state.isSyncScrollEnabled,
    fontSize: state.fontSize
  });
}

export const useMarkdownUIStore = create<MarkdownUIState>((set, get) => ({
  isLoaded: false,
  isOptionsPanelOpen: true,
  ...defaultMarkdownUISettings,
  setIsOptionsPanelOpen: (value) => set({ isOptionsPanelOpen: value }),
  setIsSyncScrollEnabled: (value) => {
    set({ isSyncScrollEnabled: value });
    persistPartial(get());
  },
  setEditorPaneWidthPercent: (value) => {
    const nextValue = Math.min(70, Math.max(30, value));
    set({ editorPaneWidthPercent: nextValue });
    persistPartial(get());
  },
  setIsWordWrapEnabled: (value) => set({ isWordWrapEnabled: value }),
  setFontSize: (value) => {
    const nextValue = Math.min(24, Math.max(12, value));
    set({ fontSize: nextValue });
    persistPartial(get());
  },
  resetSectionToDefaults: (keys) => {
    set((state) => {
      const nextState = { ...state };
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        Reflect.set(nextState, key, defaultMarkdownUISettings[key]);
      }

      persistPartial(nextState);
      return nextState;
    });
  },
  loadPersistedMarkdownUIState: () => {
    const loaded = loadMarkdownUIState();
    set((state) => ({
      isLoaded: true,
      isSyncScrollEnabled: loaded.isSyncScrollEnabled ?? state.isSyncScrollEnabled,
      editorPaneWidthPercent: loaded.editorPaneWidthPercent
        ? Math.min(70, Math.max(30, loaded.editorPaneWidthPercent))
        : state.editorPaneWidthPercent,
      fontSize: loaded.fontSize ? Math.min(24, Math.max(12, loaded.fontSize)) : state.fontSize
    }));
  }
}));
