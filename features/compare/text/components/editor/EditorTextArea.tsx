import { memo, useEffect, useRef } from "react";

interface EditorTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  fontSize: number;
  fontFamily: string;
  isWordWrapEnabled: boolean;
}

export const EditorTextArea = memo(({ label, value, onChange, placeholder, fontSize, fontFamily, isWordWrapEnabled }: EditorTextAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (initialSyncDone.current) return;
    
    const timer = setTimeout(() => {
      if (textareaRef.current && textareaRef.current.value !== value) {
        onChange(textareaRef.current.value);
      }
      initialSyncDone.current = true;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value, onChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-1 sm:hidden">
        <span className="font-bold text-text-primary text-xs">{label}</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none rounded-md border border-border-default bg-bg-primary text-text-primary p-2 sm:p-3 shadow-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none custom-scrollbar"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          whiteSpace: isWordWrapEnabled ? "pre-wrap" : "pre"
        }}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
});

EditorTextArea.displayName = "EditorTextArea";


