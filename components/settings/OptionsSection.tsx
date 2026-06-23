import type { ReactNode } from "react";
import { MdRestartAlt } from "react-icons/md";
import { getSectionResetButtonClass } from "@/utils/settingsReset";

interface OptionsSectionProps {
  title: string;
  children: ReactNode;
  isDirty?: boolean;
  onReset?: () => void;
}

export function OptionsSection({ title, children, isDirty = false, onReset }: OptionsSectionProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-secondary p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">{title}</h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={getSectionResetButtonClass(isDirty)}
            title="Restore section defaults"
          >
            <MdRestartAlt className="text-lg" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
