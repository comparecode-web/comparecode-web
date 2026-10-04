import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/uiHelpers";
import { controlSizes, fieldBase, type ControlSize } from "./controlStyles";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: ControlSize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ size = "md", rows = 5, className, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, controlSizes[size].field, "resize-y px-3", className)} {...props} />;
});
