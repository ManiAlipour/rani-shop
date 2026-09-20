import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/libs/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50",
  {
    variants: {
      variant: {
        gold: "bg-gold-500 hover:bg-gold-700 text-ink-900 shadow-lg hover:shadow-amber-900/30",
        outlineGold:
          "border border-gold-500/60 text-gold-200 hover:bg-gold-500 hover:text-ink-900 shadow-sm",
        ghost: "text-stone-200 hover:bg-white/10 hover:text-white",
        dark: "bg-ink-900 text-gold-200 hover:bg-ink-700 shadow-md",
        link: "text-gold-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "px-5 py-2 text-xs rounded-full sm:rounded-xl",
        md: "px-7 py-2.5 sm:px-9 sm:py-3 text-xs sm:text-sm lg:text-base rounded-full sm:rounded-2xl",
        lg: "px-10 py-3.5 sm:px-12 sm:py-4 text-sm sm:text-base lg:text-lg rounded-full sm:rounded-2xl",
        icon: "h-10 w-10 p-2 rounded-full",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
