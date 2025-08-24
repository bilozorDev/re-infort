import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/app/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:ring-indigo-600",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-500 focus-visible:ring-red-600",
        outline:
          "border border-gray-300 bg-white text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
        secondary:
          "bg-white text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
        ghost: "text-gray-900 hover:bg-gray-50 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:text-indigo-500 hover:underline",
      },
      size: {
        default: "px-3 py-2",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
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

export { Button, buttonVariants };