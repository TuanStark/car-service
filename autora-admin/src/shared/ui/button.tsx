import * as React from "react";
import { cn } from "@/shared/utils/format";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  readonly size?: "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover border border-transparent shadow-xs",
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-surface-subtle",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-xs",
  outline:
    "bg-transparent text-brand border border-brand/40 hover:bg-brand-soft",
  ghost:
    "bg-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink border border-transparent",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-9 px-4 text-xs sm:text-sm rounded-lg",
  lg: "h-10 px-5 text-sm rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

