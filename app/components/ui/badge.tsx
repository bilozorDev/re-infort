import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default:
          "bg-gray-50 text-gray-600 ring-gray-500/10",
        secondary:
          "bg-gray-100 text-gray-800 ring-gray-500/10",
        destructive:
          "bg-red-50 text-red-700 ring-red-600/10",
        outline:
          "border border-gray-200 bg-white text-gray-900",
        success:
          "bg-green-100 text-green-800 ring-green-600/20",
        warning:
          "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
        indigo:
          "bg-indigo-50 text-indigo-700 ring-indigo-700/10",
        blue:
          "bg-blue-100 text-blue-800 ring-blue-600/20",
        purple:
          "bg-purple-100 text-purple-800 ring-purple-600/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };