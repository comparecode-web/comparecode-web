import { db } from "@/services/db";
import { DiffHistoryItem } from "@/types/history";

export class HistoryService {
  public static async addAsync(original: string, modified: string): Promise<void> {
    const existingItems = await db.history
      .filter(x => x.originalText === original && x.modifiedText === modified)
      .toArray();

    if (existingItems.length > 0) {
      const item = existingItems[0];
      item.createdAt = new Date().toISOString();
      await db.history.put(item);
    } else {
      const newItem: DiffHistoryItem = {
        id: crypto.randomUUID(),
        originalText: original,
        modifiedText: modified,
        createdAt: new Date().toISOString(),
        isBookmarked: false
      };
      await db.history.add(newItem);
    }
  }

  public static async getAllAsync(): Promise<Array<DiffHistoryItem>> {
    const items = await db.history.toArray();
    return items.sort((a, b) => {
      if (a.isBookmarked === b.isBookmarked) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.isBookmarked ? -1 : 1;
    });
  }

  public static async updateBookmarkAsync(id: string, isBookmarked: boolean): Promise<void> {
    await db.history.update(id, { isBookmarked });
  }

  public static async deleteAsync(id: string): Promise<void> {
    await db.history.delete(id);
  }

  public static async clearAllAsync(): Promise<void> {
    await db.history.clear();
  }
}