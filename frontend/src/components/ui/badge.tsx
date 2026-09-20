import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/libs/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        gold: "bg-gold-500/15 text-gold-800 border border-gold-400/30",
        cream: "bg-cream-200 text-ink-900",
        ink: "bg-ink-900 text-gold-100",
        outline: "border border-stone-300 text-stone-600",
      },
    },
    defaultVariants: {
      variant: "gold",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
