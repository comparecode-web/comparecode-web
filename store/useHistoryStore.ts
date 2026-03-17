import { create } from "zustand";
import { DiffHistoryItem } from "@/types/history";
import { HistoryService } from "@/services/historyService";

interface HistoryState {
  items: Array<DiffHistoryItem>;
  isLoading: boolean;
  loadHistory: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  toggleBookmark: (id: string, currentStatus: boolean) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [ ],
  isLoading: false,
  loadHistory: async () => {
    set({ isLoading: true });
    const loaded = await HistoryService.getAllAsync();
    set({ items: loaded, isLoading: false });
  },
  deleteItem: async (id: string) => {
    await HistoryService.deleteAsync(id);
    await get().loadHistory();
  },
  deleteAll: async () => {
    await HistoryService.clearAllAsync();
    set({ items: [ ] });
  },
  toggleBookmark: async (id: string, currentStatus: boolean) => {
    await HistoryService.updateBookmarkAsync(id, !currentStatus);
    await get().loadHistory();
  }
}));