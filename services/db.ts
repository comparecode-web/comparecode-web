import Dexie, { type Table } from "dexie";
import { DiffHistoryItem } from "@/types/history";
import { DB_CONFIG } from "@/config/constants";

export class CompareCodeDatabase extends Dexie {
  history!: Table<DiffHistoryItem, string>;

  constructor() {
    super(DB_CONFIG.NAME);
    this.version(DB_CONFIG.VERSION).stores({
      history: "id, createdAt, isBookmarked"
    });
  }
}

export const db = new CompareCodeDatabase();