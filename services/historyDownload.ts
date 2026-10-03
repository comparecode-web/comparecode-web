import { HistoryService } from "./historyService";
import { MAX_HISTORY_BACKUP_BYTES } from "./historyBackup";
import { downloadBlob } from "@/utils/downloadBlob";

export async function downloadHistoryBackup(sessionId?: string): Promise<number> {
  const backup = await HistoryService.exportBackupAsync(sessionId);
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  if (blob.size > MAX_HISTORY_BACKUP_BYTES) throw new Error("This history exceeds the 100 MiB backup limit.");
  downloadBlob(blob, sessionId === undefined ? "comparecode-history.json" : "comparecode-comparison.json");
  return backup.sessions.length;
}
