"use client";

import { useMemo, useState } from "react";
import { MdAnimation } from "react-icons/md";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { DiffHistoryItem } from "@/types/history";
import { AnimatedHistoryList, HISTORY_MOTIONS, type HistoryMotion } from "./AnimatedHistoryList";
import { HistoryItemCard } from "./HistoryItemCard";

function samples(): DiffHistoryItem[] {
  return ["Update navigation", "Improve Markdown export", "Refresh QR styles", "Fix comparison history", "Adjust image alignment"].map((title, index) => ({
    id: `sample-${index}`, originalText: `${title}\nPrevious version`, modifiedText: `${title}\nUpdated version`,
    createdAt: new Date(Date.UTC(2026, 9, 3, 9, index)).toISOString(), isBookmarked: false
  }));
}

export function HistoryMotionPlayground() {
  const [items, setItems] = useState(samples);
  const [motion, setMotion] = useState<HistoryMotion>("slide");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [reversed, setReversed] = useState(false);
  const settings = useSettingsStore(state => state.settings);
  const visible = useMemo(() => items.filter(item => !bookmarksOnly || item.isBookmarked).sort((a, b) => Number(b.isBookmarked) - Number(a.isBookmarked) || (reversed ? 1 : -1) * a.createdAt.localeCompare(b.createdAt)), [items, bookmarksOnly, reversed]);
  return <PageContent contentClassName="space-y-5">
    <PageHeader title="History motion studio" description="Try five motion styles with sample cards. Your saved history stays untouched." icon={MdAnimation} />
    <section className="space-y-4 rounded-xl border border-border-default bg-bg-primary p-4">
      <SelectionBar value={motion} onChange={setMotion} options={HISTORY_MOTIONS.map(({ value, label }) => ({ value, label }))} className="flex flex-wrap" />
      <p className="text-sm text-text-secondary">{HISTORY_MOTIONS.find(option => option.value === motion)?.description}</p>
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
      empty={<p className="text-sm text-text-secondary">No cards in this view. Add a card or reset the samples.</p>}
    >
      {item => <HistoryItemCard
        item={item}
        fontFamily={settings.fontFamily}
        dateFormat={settings.dateFormat}
        timeFormat={settings.timeFormat}
        tickerNowMs={Date.UTC(2026, 9, 3, 10)}
        onRestore={() => {}}
        onDelete={event => {
          event.stopPropagation();
          setItems(current => current.filter(row => row.id !== item.id));
        }}
        onToggleBookmark={event => {
          event.stopPropagation();
          setItems(current => current.map(row => row.id === item.id ? { ...row, isBookmarked: !row.isBookmarked } : row));
        }}
      />}
    </AnimatedHistoryList>
  </PageContent>;
}
