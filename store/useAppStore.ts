import { create } from "zustand";

export type AppView = "editor" | "history" | "settings";

interface AppState {
  currentView: AppView;
  navigate: (view: AppView) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "editor",
  navigate: (view: AppView) => set({ currentView: view })
}));