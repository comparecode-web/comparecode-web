import { create } from "zustand";

interface EditorUIState {
  isInputExpanded: boolean;
  isComparing: boolean;
  showTextTest: boolean;
  setShowTextTest: (show: boolean) => void;
  isOptionsPanelOpen: boolean;
  optionsPanelTab: "options" | "history";
  toggleInputPanel: () => void;
  setIsInputExpanded: (expanded: boolean) => void;
  setIsComparing: (comparing: boolean) => void;
  setIsOptionsPanelOpen: (open: boolean) => void;
  setOptionsPanelTab: (tab: "options" | "history") => void;
}

export const useEditorUIStore = create<EditorUIState>((set) => ({
  isInputExpanded: true,
  isComparing: false,
  showTextTest: true,
  setShowTextTest: (showTextTest) => set({ showTextTest }),
  isOptionsPanelOpen: false,
  optionsPanelTab: "options",
  toggleInputPanel: () => set((state) => ({ isInputExpanded: !state.isInputExpanded })),
  setIsInputExpanded: (expanded: boolean) => set({ isInputExpanded: expanded }),
  setIsComparing: (comparing: boolean) => set({ isComparing: comparing }),
  setIsOptionsPanelOpen: (open: boolean) => set({ isOptionsPanelOpen: open }),
  setOptionsPanelTab: (tab: "options" | "history") => set({ optionsPanelTab: tab })
}));

export const useTextUIStore = useEditorUIStore;

