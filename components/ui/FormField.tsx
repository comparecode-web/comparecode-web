"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";

interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}

export function FormField({ label, description, error, className, children }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  return <div className={cn("flex min-w-0 flex-col gap-1", className)}>
    <label htmlFor={id} className="text-xs font-semibold text-text-secondary">{label}</label>
    {children({ id, "aria-describedby": error || description ? messageId : undefined, "aria-invalid": error ? true : undefined })}
    {(error || description) && <p id={messageId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-danger" : "text-text-secondary")}>{error || description}</p>}
  </div>;
}
