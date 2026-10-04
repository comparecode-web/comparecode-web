import { MdRestartAlt } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";
import { IconButton, type IconButtonProps } from "./IconButton";

interface ResetButtonProps extends Omit<IconButtonProps, "children" | "isActive" | "variant"> {
  isDirty?: boolean;
}

export function ResetButton({ isDirty = false, size = "sm", className, title = "Restore defaults", ...props }: ResetButtonProps) {
  return <IconButton size={size} title={title} className={cn(isDirty && "border-accent-primary/60 bg-accent-primary/10 text-accent-primary hover:border-accent-primary hover:text-accent-hover", className)} {...props}><MdRestartAlt /></IconButton>;
}
