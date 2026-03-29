import { create } from "zustand";

export interface ImageHistoryRestorePayload {
  sessionId: string;
  originalImageUrl: string;
  modifiedImageUrl: string;
}

interface ImageState {
  pendingHistoryRestore: ImageHistoryRestorePayload | null;
  setPendingHistoryRestore: (payload: ImageHistoryRestorePayload | null) => void;
  clearPendingHistoryRestore: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  pendingHistoryRestore: null,
  setPendingHistoryRestore: (payload) => set({ pendingHistoryRestore: payload }),
  clearPendingHistoryRestore: () => set({ pendingHistoryRestore: null })
}));
