import { memo } from "react";

interface EditorTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  fontSize: number;
  isWordWrapEnabled: boolean;
}

export const EditorTextArea = memo(({ label, value, onChange, placeholder, fontSize, isWordWrapEnabled }: EditorTextAreaProps) => {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-1 sm:hidden">
        <span className="font-bold text-text-primary text-xs">{label}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none rounded-md border border-border-default bg-bg-primary text-text-primary p-2 sm:p-3 shadow-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-mono outline-none custom-scrollbar"
        style={{
          fontSize: `${fontSize}px`,
          whiteSpace: isWordWrapEnabled ? "pre-wrap" : "pre"
        }}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
});

EditorTextArea.displayName = "EditorTextArea";