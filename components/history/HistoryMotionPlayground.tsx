"use client";

import { useMemo, useState } from "react";
import { MdAnimation, MdBookmark, MdBookmarkBorder, MdDelete, MdReplay } from "react-icons/md";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { IconButton } from "@/components/ui/IconButton";
import type { DiffHistoryItem } from "@/types/history";
import { AnimatedHistoryList, DEFAULT_HISTORY_MOTION, HISTORY_MOTIONS, type HistoryMotion } from "./AnimatedHistoryList";

function samples(): DiffHistoryItem[] {
  return ["Update navigation", "Improve Markdown export", "Refresh QR styles", "Fix comparison history", "Adjust image alignment"].map((title, index) => ({
    id: `sample-${index}`, originalText: `${title}\nPrevious version`, modifiedText: `${title}\nUpdated version`,
    createdAt: new Date(Date.UTC(2026, 9, 3, 9, index)).toISOString(), isBookmarked: false
  }));
}

export function HistoryMotionPlayground() {
  const [items, setItems] = useState(samples);
  const [motion, setMotion] = useState<HistoryMotion>(DEFAULT_HISTORY_MOTION);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [speed, setSpeed] = useState("normal");
  const [replayKey, setReplayKey] = useState(0);
  const visible = useMemo(() => items.filter(item => !bookmarksOnly || item.isBookmarked).sort((a, b) => Number(b.isBookmarked) - Number(a.isBookmarked) || (reversed ? 1 : -1) * a.createdAt.localeCompare(b.createdAt)), [items, bookmarksOnly, reversed]);
  return <PageContent contentClassName="space-y-5">
    <PageHeader title="History motion studio" description="Try five motion styles with sample cards. Your saved history stays untouched." icon={MdAnimation} />
    <section className="space-y-4 rounded-xl border border-border-default bg-bg-primary p-4">
      <SelectionBar value={motion} onChange={value => { setMotion(value); setReplayKey(key => key + 1); }} options={HISTORY_MOTIONS.map(({ value, label }) => ({ value, label }))} className="flex flex-wrap" />
      <p className="text-sm text-text-secondary">{HISTORY_MOTIONS.find(option => option.value === motion)?.description}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" leftIcon={<MdReplay />} onClick={() => setReplayKey(key => key + 1)}>Replay animation</Button>
        <fieldset className="min-w-0"><legend className="mb-1 text-xs text-text-secondary">Preview speed</legend><SelectionBar value={speed} onChange={setSpeed} options={[{ value: "normal", label: "Normal" }, { value: "slow", label: "Slow (½ speed)" }]} /></fieldset>
        <p className="text-xs text-text-secondary">Changing styles replays the entrance. Reduced motion follows your system setting.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setItems(current => [{ ...samples()[0], id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...current])}>Add card</Button>
        <Button size="sm" variant="outline" onClick={() => setReversed(value => !value)}>Reverse order</Button>
        <Button size="sm" variant="outline" onClick={() => setBookmarksOnly(value => !value)}>{bookmarksOnly ? "Show all" : "Bookmarks only"}</Button>
        <Button size="sm" variant="outline" onClick={() => { setItems(samples()); setBookmarksOnly(false); setReversed(false); }}>Reset samples</Button>
      </div>
    </section>
    <AnimatedHistoryList
      items={visible}
      motion={motion}
      playbackRate={speed === "slow" ? .5 : 1}
      replayKey={replayKey}
      empty={<p className="text-sm text-text-secondary">No cards in this view. Add a card or reset the samples.</p>}
    >
      {item => <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border-default bg-bg-primary px-3 py-2 shadow-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-selected text-accent-primary"><MdAnimation /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{item.originalText.split("\n")[0]}</p><p className="text-xs text-text-secondary">Sample comparison</p></div>
        <IconButton size="sm" title="Bookmark sample" aria-pressed={item.isBookmarked} isActive={item.isBookmarked} onClick={() => setItems(current => current.map(row => row.id === item.id ? { ...row, isBookmarked: !row.isBookmarked } : row))}>{item.isBookmarked ? <MdBookmark /> : <MdBookmarkBorder />}</IconButton>
        <IconButton size="sm" variant="dangerGhost" title="Delete sample" onClick={() => setItems(current => current.filter(row => row.id !== item.id))}><MdDelete /></IconButton>
      </div>}
    </AnimatedHistoryList>
  </PageContent>;
}
