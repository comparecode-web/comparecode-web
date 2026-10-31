import { create } from "zustand";
import { UNCHANGED_REVEAL_STEP, type UnchangedExpansions } from "@/features/compare/text/utils/unchangedRegions";

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
  unchangedExpansions: UnchangedExpansions;
  isLiveUpdatePaused: boolean;
  setIsLiveUpdatePaused: (paused: boolean) => void;
  revealUnchanged: (key: string, direction: "above" | "below" | "all") => void;
  resetUnchangedExpansions: () => void;
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
  setOptionsPanelTab: (tab: "options" | "history") => set({ optionsPanelTab: tab }),
  unchangedExpansions: {},
  isLiveUpdatePaused: false,
  setIsLiveUpdatePaused: (isLiveUpdatePaused) => set({ isLiveUpdatePaused }),
  revealUnchanged: (key, direction) => set((state) => {
    const current = state.unchangedExpansions[key];
    if (current === "all") return state;
    const next = direction === "all" ? "all" : {
      above: (current?.above ?? 0) + (direction === "above" ? UNCHANGED_REVEAL_STEP : 0),
      below: (current?.below ?? 0) + (direction === "below" ? UNCHANGED_REVEAL_STEP : 0)
    };
    return { unchangedExpansions: { ...state.unchangedExpansions, [key]: next } };
  }),
  resetUnchangedExpansions: () => set({ unchangedExpansions: {} })
}));

export const useTextUIStore = useEditorUIStore;

