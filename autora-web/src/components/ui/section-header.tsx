import * as React from "react";
import { cn } from "@/core/lib/cn";

interface SectionHeaderProps {
  readonly indexLabel: string;
  readonly eyebrow: string;
  readonly title: React.ReactNode;
  readonly description?: string;
  readonly align?: "left" | "between";
  readonly rightSlot?: React.ReactNode;
  readonly className?: string;
}

export function SectionHeader({
  indexLabel,
  eyebrow,
  title,
  description,
  align = "left",
  rightSlot,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-line pb-7",
        align === "between" && "lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest text-ink-inverse">
            {indexLabel}
          </span>
          <span className="h-[1px] w-6 bg-brand/40" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-secondary">
            {eyebrow}
          </span>
        </div>

        <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.98] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h2>

        {description && (
          <p className="max-w-2xl pt-1 text-base leading-relaxed text-ink-secondary sm:text-lg">
            {description}
          </p>
        )}
      </div>

      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
