interface MarkdownStatsBarProps {
  value: string;
}

function getWordCount(value: string): number {
  const matches = value.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function MarkdownStatsBar({ value }: MarkdownStatsBarProps) {
  const words = getWordCount(value);
  const chars = value.length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary">
      <span className="rounded border border-border-default bg-bg-primary px-2 py-1">{words} Words</span>
      <span className="rounded border border-border-default bg-bg-primary px-2 py-1">{chars} Chars</span>
    </div>
  );
}
