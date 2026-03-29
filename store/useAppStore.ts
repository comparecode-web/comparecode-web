import { create } from "zustand";

export type AppView = "text" | "image" | "history" | "settings";

interface AppState {
  currentView: AppView;
  navigate: (view: AppView) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "text",
  navigate: (view: AppView) => set({ currentView: view })
}));