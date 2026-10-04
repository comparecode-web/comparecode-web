import type { ReactNode } from "react";
import { ResetButton } from "@/components/ui/ResetButton";

interface OptionsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isDirty?: boolean;
  onReset?: () => void;
  density?: "compact" | "comfortable";
}

export function OptionsSection({ title, description, children, isDirty = false, onReset, density = "compact" }: OptionsSectionProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-2 rounded-xl border border-border-default bg-bg-primary ${density === "comfortable" ? "p-4 sm:p-6" : "p-2.5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div><h3 className={density === "comfortable" ? "text-lg font-bold text-text-primary" : "text-xs font-bold text-text-secondary"}>{title}</h3>{description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}</div>
        {onReset && (
          <ResetButton
            onClick={onReset}
            isDirty={isDirty}
            className={density === "compact" ? "size-7" : undefined}
            title="Restore section defaults"
            aria-label={`Restore ${title} defaults`}
          />
        )}
      </div>
      {children}
    </section>
  );
}
