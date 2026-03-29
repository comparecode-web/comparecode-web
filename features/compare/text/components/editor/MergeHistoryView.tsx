"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MdHistoryToggleOff } from "react-icons/md";
import { HistoryService } from "@/services/historyService";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatAbsoluteDateTimeWithSettings, getRelativeTime } from "@/utils/formatters";
import { HistoryActionDirection, HistoryActionType } from "@/types/history";
import { cn } from "@/utils/uiHelpers";
import { useLiveTimeTicker } from "@/features/compare/text/hooks/useLiveTimeTicker";

type SnapshotTone = "initial" | "added" | "removed" | "neutral";
type SnapshotKind = "initial" | "merge" | "swap";

interface MergeSnapshotItem {
  id: string;
  kind: SnapshotKind;
  updatedAt: string;
  originalText: string;
  modifiedText: string;
  originalLinesAffected: number;
  modifiedLinesAffected: number;
  tone: SnapshotTone;
}

export function MergeHistoryView() {
  const { historySessionId, historyRefreshKey, leftText, rightText, loadFromHistory } = useEditorStore();
  const settings = useSettingsStore((state) => state.settings);
  const [snapshots, setSnapshots] = useState<Array<MergeSnapshotItem>>([]);
  const tickerNowMs = useLiveTimeTicker(snapshots.map((snapshot) => snapshot.updatedAt));

  const reloadSnapshots = useCallback(async () => {
    if (!historySessionId) {
      setSnapshots([]);
      return;
    }

    const [session, steps] = await Promise.all([
      HistoryService.getSessionAsync(historySessionId),
      HistoryService.getSessionStepsAsync(historySessionId)
    ]);

    if (!session) {
      setSnapshots([]);
      return;
    }

    const nextSnapshots: Array<MergeSnapshotItem> = [
      {
        id: `${historySessionId}-initial`,
        kind: "initial",
        updatedAt: session.createdAt,
        originalText: steps.length > 0 ? steps[0].beforeOriginalText : session.originalText,
        modifiedText: steps.length > 0 ? steps[0].beforeModifiedText : session.modifiedText,
        originalLinesAffected: 0,
        modifiedLinesAffected: 0,
        tone: "initial"
      }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let tone: SnapshotTone = "neutral";
      let kind: SnapshotKind = "merge";

      if (step.actionType === HistoryActionType.Swap) {
        kind = "swap";
      } else if (step.actionType === HistoryActionType.Merge) {
        if (step.direction === HistoryActionDirection.LeftToRight) {
          tone = "removed";
        }

        if (step.direction === HistoryActionDirection.RightToLeft) {
          tone = "added";
        }
      }

      nextSnapshots.push({
        id: step.id,
        kind,
        updatedAt: step.createdAt,
        originalText: step.afterOriginalText,
        modifiedText: step.afterModifiedText,
        originalLinesAffected: step.originalLinesAffected ?? 0,
        modifiedLinesAffected: step.modifiedLinesAffected ?? 0,
        tone
      });
    }

    setSnapshots(nextSnapshots.reverse());
  }, [historySessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadSnapshots();
  }, [reloadSnapshots, historyRefreshKey]);

  const activeSnapshotId = useMemo(() => {
    const active = snapshots.find((snapshot) => snapshot.originalText === leftText && snapshot.modifiedText === rightText);
    return active?.id ?? null;
  }, [snapshots, leftText, rightText]);

  const handleRestoreSnapshot = (snapshot: MergeSnapshotItem) => {
    if (!historySessionId) {
      return;
    }

    loadFromHistory(snapshot.originalText, snapshot.modifiedText, settings, historySessionId);
  };

  const getToneClass = (tone: SnapshotTone): string => {
    if (tone === "added") {
      return "bg-[var(--diff-added-bg)] border-[var(--diff-added-fg)]";
    }

    if (tone === "removed") {
      return "bg-[var(--diff-removed-bg)] border-[var(--diff-removed-fg)]";
    }

    return "bg-bg-secondary border-border-default";
  };

  const renderSnapshotTitle = (snapshot: MergeSnapshotItem) => {
    if (snapshot.kind === "initial") {
      return <span className="text-xs font-semibold text-text-primary">Initial state</span>;
    }

    if (snapshot.kind === "swap") {
      return (
        <span className="text-xs font-semibold text-text-primary">
          <span className="mr-1">Swap</span>
          <span className="text-danger">({snapshot.originalLinesAffected})</span>
          <span className="mx-0.5" />
          <span className="text-success">({snapshot.modifiedLinesAffected})</span>
        </span>
      );
    }

    return (
      <span className="text-xs font-semibold text-text-primary">
        <span className="mr-1">Merge</span>
        <span className="text-danger">({snapshot.originalLinesAffected})</span>
        <span className="mx-0.5" />
        <span className="text-success">({snapshot.modifiedLinesAffected})</span>
      </span>
    );
  };

  if (!historySessionId || snapshots.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <MdHistoryToggleOff className="text-4xl text-text-secondary" />
        <p className="text-sm font-semibold text-text-secondary">No merge history yet</p>
        <p className="text-xs text-text-secondary">Snapshots appear here after merge actions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 sm:p-4">
      {snapshots.map((snapshot) => {
        const isActive = activeSnapshotId === snapshot.id;

        return (
          <button
            key={snapshot.id}
            onClick={() => handleRestoreSnapshot(snapshot)}
            className={cn(
              "w-full rounded-md border px-2.5 py-2 text-left transition-all duration-(--duration-short) hover:brightness-95",
              getToneClass(snapshot.tone),
              isActive && "ring-1 ring-accent-primary"
            )}
            title="Restore this snapshot"
          >
            <div className="flex items-center justify-between gap-2">
              {renderSnapshotTitle(snapshot)}
              <span className="text-[11px] font-semibold text-text-secondary">{getRelativeTime(snapshot.updatedAt, tickerNowMs)}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-text-secondary">
              {formatAbsoluteDateTimeWithSettings(snapshot.updatedAt, settings.dateFormat, settings.timeFormat)}
            </p>
          </button>
        );
      })}
    </div>
  );
}



