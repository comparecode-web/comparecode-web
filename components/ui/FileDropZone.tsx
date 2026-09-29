"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";

interface FileDropZoneProps {
  children: ReactNode;
  onFilesDrop: (files: FileList, event: DragEvent<HTMLDivElement>) => void;
  label: ReactNode;
  className?: string;
  overlayClassName?: string;
  onFileDrag?: (event: DragEvent<HTMLDivElement>) => void;
}

export function FileDropZone({ children, onFilesDrop, label, className, overlayClassName, onFileDrag }: FileDropZoneProps) {
  const depth = useRef(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const isFileDrag = (event: DragEvent<HTMLDivElement>) => Array.from(event.dataTransfer.types).includes("Files");

  const reset = () => {
    depth.current = 0;
    setIsDraggingFile(false);
  };
  useEffect(() => {
    if (!isDraggingFile) return;
    const clear = () => { depth.current = 0; setIsDraggingFile(false); };
    window.addEventListener("drop", clear);
    window.addEventListener("dragend", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("drop", clear);
      window.removeEventListener("dragend", clear);
      window.removeEventListener("blur", clear);
    };
  }, [isDraggingFile]);

  return <div
    data-file-drop-zone
    className={cn("relative", className)}
    onDragEnter={(event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current += 1;
      setIsDraggingFile(true);
      onFileDrag?.(event);
    }}
    onDragOver={(event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      onFileDrag?.(event);
    }}
    onDragLeave={(event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) reset();
    }}
    onDrop={(event) => {
      if (!isFileDrag(event) && event.dataTransfer.files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      reset();
      onFilesDrop(event.dataTransfer.files, event);
    }}
  >
    {children}
    {isDraggingFile && <div className={cn("pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-md border-2 border-dashed border-accent-primary bg-bg-primary/90 text-sm font-bold text-accent-primary backdrop-blur-[1px]", overlayClassName)}>
      {label}
    </div>}
  </div>;
}
