import { memo, useEffect, useRef } from "react";
import { MdFileOpen } from "react-icons/md";
import { FileDropZone } from "@/components/ui/FileDropZone";

interface EditorTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  fontSize: number;
  fontFamily: string;
  isWordWrapEnabled: boolean;
  onFileDrop?: (files: FileList) => void;
  onOpenFile?: () => void;
}

export const EditorTextArea = memo(({ label, value, onChange, placeholder, fontSize, fontFamily, isWordWrapEnabled, onFileDrop, onOpenFile }: EditorTextAreaProps) => {
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
    <FileDropZone
      className="flex min-w-0 flex-col flex-1 min-h-0"
      label={`Drop file into ${label.toLowerCase()} text`}
      onFilesDrop={(files) => onFileDrop?.(files)}
    >
      <div className="mb-1 flex items-center justify-between gap-2 sm:hidden">
        <span className="font-bold text-text-primary text-xs">{label}</span>
        <button type="button" aria-label={`Import ${label.toLowerCase()} text file`} title="Import" onClick={onOpenFile} className="inline-flex size-8 items-center justify-center rounded-md text-lg text-text-primary hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-accent-primary"><MdFileOpen /></button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 min-w-0 flex-1 resize-none rounded-xl border border-border-default bg-bg-primary text-text-primary p-2 sm:p-3 shadow-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none custom-scrollbar"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          whiteSpace: isWordWrapEnabled ? "pre-wrap" : "pre"
        }}
        placeholder={placeholder}
        spellCheck={false}
      />
    </FileDropZone>
  );
});

EditorTextArea.displayName = "EditorTextArea";


