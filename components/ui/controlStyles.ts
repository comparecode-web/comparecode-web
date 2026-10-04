export type ControlSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "danger" | "success" | "ghost" | "outline" | "dangerGhost";

export const controlSizes: Record<ControlSize, { field: string; icon: string; iconContent: string }> = {
  sm: { field: "min-h-8 px-3 py-1 text-sm", icon: "size-8 text-lg", iconContent: "text-lg" },
  md: { field: "min-h-9 px-4 py-1.5 text-sm", icon: "size-9 text-xl", iconContent: "text-xl" },
  lg: { field: "min-h-11 px-4 py-2 text-base", icon: "size-11 text-xl", iconContent: "text-xl" }
};

export const controlFocus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/45";
export const controlDisabled = "disabled:cursor-not-allowed disabled:opacity-50";
export const buttonBase = `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent font-semibold transition-colors ${controlFocus} ${controlDisabled}`;
export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-white hover:bg-accent-hover shadow-sm",
  danger: "bg-danger text-white border-danger/20 hover:bg-danger-hover shadow-sm",
  success: "bg-success text-white hover:bg-success-hover shadow-sm",
  ghost: "bg-transparent text-text-secondary hover:border-border-default hover:bg-hover-overlay hover:text-text-primary",
  outline: "bg-transparent border-border-default text-text-primary hover:bg-hover-overlay",
  dangerGhost: "text-danger hover:border-danger/30 hover:bg-danger/10 hover:text-danger-hover"
};
export const fieldBase = `min-w-0 w-full rounded-md border border-border-default bg-bg-secondary text-text-primary transition-colors placeholder:text-text-secondary/60 focus:border-accent-primary aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/45 ${controlFocus} ${controlDisabled}`;
