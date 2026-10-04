import type { ReactNode } from "react";
import { MdClose } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { IconButton } from "./IconButton";

interface DialogHeaderProps {
  title: string;
  titleId: string;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
  actions?: ReactNode;
}

export function DialogHeader({ title, titleId, onClose, closeLabel = "Close dialog", className, actions }: DialogHeaderProps) {
  return <div className={cn("flex shrink-0 items-center justify-between gap-2 border-b border-border-default p-4", className)}>
    <h2 id={titleId} className="text-lg font-bold">{title}</h2>
    <div className="flex items-center gap-2">{actions}<IconButton size="sm" variant="outline" aria-label={closeLabel} onClick={onClose}><MdClose /></IconButton></div>
  </div>;
}
