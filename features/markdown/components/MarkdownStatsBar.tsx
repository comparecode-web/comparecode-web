interface MarkdownStatsBarProps {
  value: string;
  compact?: boolean;
}

function getWordCount(value: string): number {
  const matches = value.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function MarkdownStatsBar({ value, compact = false }: MarkdownStatsBarProps) {
  const words = getWordCount(value);
  const chars = value.length;

  if (compact) {
    return (
      <span className="shrink-0 text-xs font-semibold normal-case tracking-normal text-text-secondary">
        {words} Words · {chars} Chars
      </span>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 text-xs font-semibold normal-case tracking-normal text-text-secondary">
      <span className="rounded border border-border-default bg-bg-primary px-2 py-0.5">{words} Words</span>
      <span className="rounded border border-border-default bg-bg-primary px-2 py-0.5">{chars} Chars</span>
    </div>
  );
}
