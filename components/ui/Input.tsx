import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/uiHelpers";
import { controlSizes, fieldBase, type ControlSize } from "./controlStyles";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: ControlSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ size = "md", className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, controlSizes[size].field, "px-3", className)} {...props} />;
});
