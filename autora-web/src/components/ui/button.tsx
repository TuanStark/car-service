import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/core/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-display font-bold uppercase tracking-[0.04em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-ink-inverse hover:bg-brand-hover shadow-xs hover:shadow-sm",
        accent:
          "bg-accent text-ink-inverse hover:bg-accent-hover shadow-xs hover:shadow-sm",
        secondary:
          "bg-surface text-ink border border-line-strong hover:border-brand hover:bg-surface-subtle",
        outline:
          "bg-transparent text-brand border border-brand/40 hover:border-brand hover:bg-brand-soft",
        ghost:
          "bg-transparent text-ink-secondary hover:text-ink hover:bg-surface-subtle",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-13 px-8 text-base md:text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
