import { create } from "zustand";

interface EditorUIState {
  isInputExpanded: boolean;
  isComparing: boolean;
  isOptionsPanelOpen: boolean;
  toggleInputPanel: () => void;
  setIsInputExpanded: (expanded: boolean) => void;
  setIsComparing: (comparing: boolean) => void;
  setIsOptionsPanelOpen: (open: boolean) => void;
}

export const useEditorUIStore = create<EditorUIState>((set) => ({
  isInputExpanded: true,
  isComparing: false,
  isOptionsPanelOpen: true,
  toggleInputPanel: () => set((state) => ({ isInputExpanded: !state.isInputExpanded })),
  setIsInputExpanded: (expanded: boolean) => set({ isInputExpanded: expanded }),
  setIsComparing: (comparing: boolean) => set({ isComparing: comparing }),
  setIsOptionsPanelOpen: (open: boolean) => set({ isOptionsPanelOpen: open })
}));