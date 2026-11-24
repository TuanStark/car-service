import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/core/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-soft text-brand border border-brand/20",
        accent:
          "bg-accent-soft text-accent border border-accent/25",
        solidAccent:
          "bg-accent text-ink-inverse font-bold uppercase tracking-wider",
        solidBrand:
          "bg-brand text-ink-inverse font-bold uppercase tracking-wider",
        muted:
          "bg-surface-subtle text-ink-secondary border border-line",
        technical:
          "bg-surface/95 backdrop-blur-md text-ink border border-line-strong font-mono text-[11px] uppercase tracking-[0.12em]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
