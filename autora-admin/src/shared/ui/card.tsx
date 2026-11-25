import * as React from "react";
import { cn } from "@/shared/utils/format";

export function Card({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-surface shadow-xs",
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4",
        className
      )}
    >
      <div>
        <h2 className="text-sm sm:text-base font-bold text-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

