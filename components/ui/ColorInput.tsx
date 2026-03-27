import { useId, useMemo, useRef } from "react";

interface ColorInputProps {
  label: string;
  value: string;
  placeholder?: string;
  pickerFallback?: string;
  onChange: (value: string) => void;
  onRestoreDefault?: () => void;
  isDifferentFromDefault?: boolean;
}

function normalizeHexForPicker(value: string): string | null {
  const trimmed = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return null;
}

export function ColorInput({
  label,
  value,
  placeholder,
  pickerFallback = "#000000",
  onChange,
  onRestoreDefault,
  isDifferentFromDefault = false
}: ColorInputProps) {
  const pickerId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);

  const pickerValue = useMemo(() => {
    const fromValue = normalizeHexForPicker(value);
    const fromFallback = normalizeHexForPicker(pickerFallback);
    return fromValue ?? fromFallback ?? "#000000";
  }, [pickerFallback, value]);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-bg-secondary text-text-primary border border-border-default rounded-md px-3 py-2 text-sm outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
          placeholder={placeholder}
        />

        <input
          id={pickerId}
          ref={pickerRef}
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label={`${label} color picker`}
        />

        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="h-10 w-10 shrink-0 rounded-md border border-border-default bg-bg-secondary p-1 transition-colors hover:border-accent-primary"
          title={`Pick ${label.toLowerCase()} color`}
          aria-controls={pickerId}
          aria-label={`Open ${label.toLowerCase()} color picker`}
        >
          <span
            className="block h-full w-full rounded-sm border border-border-default"
            style={{ backgroundColor: pickerValue }}
          />
        </button>

        {onRestoreDefault && (
          <button
            type="button"
            onClick={onRestoreDefault}
            className={[
              "h-10 shrink-0 rounded-md border px-2 text-xs font-semibold transition-colors",
              isDifferentFromDefault
                ? "border-accent-primary/60 bg-accent-primary/10 text-accent-primary hover:border-accent-primary"
                : "border-border-default bg-bg-secondary text-text-secondary hover:border-accent-primary hover:text-accent-primary"
            ].join(" ")}
            title={`Restore ${label.toLowerCase()} to theme default`}
            aria-label={`Restore ${label.toLowerCase()} to theme default`}
          >
            Restore
          </button>
        )}
      </div>
    </label>
  );
}
