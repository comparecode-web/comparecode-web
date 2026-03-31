import { create } from "zustand";

interface EditorUIState {
  isInputExpanded: boolean;
  isComparing: boolean;
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
  isOptionsPanelOpen: true,
  optionsPanelTab: "options",
  toggleInputPanel: () => set((state) => ({ isInputExpanded: !state.isInputExpanded })),
  setIsInputExpanded: (expanded: boolean) => set({ isInputExpanded: expanded }),
  setIsComparing: (comparing: boolean) => set({ isComparing: comparing }),
  setIsOptionsPanelOpen: (open: boolean) => set({ isOptionsPanelOpen: open }),
  setOptionsPanelTab: (tab: "options" | "history") => set({ optionsPanelTab: tab })
}));

export const useTextUIStore = useEditorUIStore;

