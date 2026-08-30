import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium tracking-tight text-foreground"
      >
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export function OptionChip({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group rounded-2xl border px-4 py-3 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-foreground",
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      {hint ? (
        <span
          className={cn(
            "mt-0.5 block text-xs",
            selected ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}

export function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
