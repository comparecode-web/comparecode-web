import type { ComponentType, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex min-w-0 flex-wrap items-start justify-between gap-4 sm:mb-7">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"><Icon className="text-2xl" /></span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
      </div>
      {actions}
    </header>
  );
}
