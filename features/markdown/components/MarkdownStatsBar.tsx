interface MarkdownStatsBarProps {
  value: string;
  compact?: boolean;
}

const wordsPerMinute = 200;

function getWordCount(value: string): number {
  const matches = value.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function getReadingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function MarkdownStatsBar({ value, compact = false }: MarkdownStatsBarProps) {
  const words = getWordCount(value);
  const chars = value.length;
  const readingMinutes = getReadingMinutes(words);

  if (compact) {
    return (
      <span className="shrink-0 text-xs font-semibold normal-case tracking-normal text-text-secondary">
        {words} Words / {chars} Characters
      </span>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 text-xs font-semibold normal-case tracking-normal text-text-secondary">
      {readingMinutes > 0 && <span className="rounded border border-border-default bg-bg-primary px-2 py-0.5">{readingMinutes} min read</span>}
      <span className="rounded border border-border-default bg-bg-primary px-2 py-0.5">{words} Words</span>
      <span className="rounded border border-border-default bg-bg-primary px-2 py-0.5">{chars} Characters</span>
    </div>
  );
}
