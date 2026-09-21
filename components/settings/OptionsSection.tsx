import type { ReactNode } from "react";
import { MdRestartAlt } from "react-icons/md";
import { getSectionResetButtonClass } from "@/utils/settingsReset";

interface OptionsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isDirty?: boolean;
  onReset?: () => void;
}

export function OptionsSection({ title, description, children, isDirty = false, onReset }: OptionsSectionProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-2 rounded-xl border border-border-default bg-bg-primary ${description ? "p-4 sm:p-6" : "p-2.5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div><h3 className={description ? "text-lg font-bold text-text-primary" : "text-xs font-bold text-text-secondary"}>{title}</h3>{description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}</div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={`${getSectionResetButtonClass(isDirty)} flex shrink-0 items-center justify-center`}
            title="Restore section defaults"
            aria-label={`Restore ${title} defaults`}
          >
            <MdRestartAlt className="text-lg" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
