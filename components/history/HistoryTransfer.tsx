"use client";

import { useRef, useState } from "react";
import { MdDownload, MdUploadFile } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { HistoryService } from "@/services/historyService";
import { MAX_HISTORY_BACKUP_BYTES, parseHistoryBackup, type HistoryBackup } from "@/services/historyBackup";
import { downloadBlob } from "@/utils/downloadBlob";

export function HistoryTransfer({ onImported }: { onImported: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<HistoryBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "The history transfer failed. Please try again."); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-border-default bg-bg-primary p-3" aria-label="History backup">
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy} leftIcon={<MdDownload />} onClick={() => void run(async () => {
        const backup = await HistoryService.exportBackupAsync();
        const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
        if (blob.size > MAX_HISTORY_BACKUP_BYTES) throw new Error("This history exceeds the 100 MiB backup limit.");
        downloadBlob(blob, "comparecode-history.json"); setMessage(`Exported ${backup.sessions.length} comparisons.`);
      })}>Export history</Button>
      <Button size="sm" variant="outline" disabled={busy} leftIcon={<MdUploadFile />} onClick={() => input.current?.click()}>Import history</Button>
      <span className="text-xs text-text-secondary">Includes all comparisons, images, bookmarks and merge steps.</span>
      <input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label="Choose history backup" onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ""; setPending(null);
        if (file) void run(async () => {
          if (file.size > MAX_HISTORY_BACKUP_BYTES) throw new Error("History backups can be up to 100 MiB.");
          setPending(parseHistoryBackup(await file.text()));
        });
      }} />
    </div>
    {pending && <div className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-secondary p-3">
      <p className="flex-1 text-sm text-text-primary">Ready to import {pending.sessions.length} comparisons ({pending.sessions.filter(entry => entry.item.compareMode === "image").length} image comparisons). Existing history is kept; identical entries are skipped.</p>
      <Button size="sm" disabled={busy} onClick={() => void run(async () => {
        const result = await HistoryService.importBackupAsync(pending);
        setPending(null); await onImported(); setMessage(`Imported ${result.added} comparisons. Skipped ${result.skipped} identical entries.`);
      })}>Add to history</Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setPending(null)}>Cancel</Button>
    </div>}
    {busy && <p role="status" className="text-sm text-text-secondary">Processing history…</p>}
    {message && <p role="status" className="text-sm text-text-secondary">{message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </section>;
}
