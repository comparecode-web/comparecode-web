export function DiffColorPreview() {
  return (
    <figure className="min-w-0 rounded-xl border border-border-default bg-bg-secondary p-4">
      <figcaption className="mb-4"><span className="text-sm font-semibold text-text-primary">Diff color preview</span><p className="mt-1 text-xs text-text-secondary">Your current theme and highlight colors.</p></figcaption>
      <div className="overflow-hidden rounded-lg border border-border-default bg-bg-primary py-3 font-mono text-sm leading-7 text-text-primary">
        <div className="px-3 text-text-secondary">{"// A small change"}</div>
        <div className="break-all bg-diff-removed-bg px-3"><span className="mr-3 text-danger">−</span>const message = &quot;<span className="rounded bg-diff-removed-fg">Hello world</span>&quot;;</div>
        <div className="break-all bg-diff-added-bg px-3"><span className="mr-3 text-success">+</span>const message = &quot;<span className="rounded bg-diff-added-fg">Hello CompareCode</span>&quot;;</div>
        <div className="break-all px-3">  console.log(message);</div>
      </div>
    </figure>
  );
}
