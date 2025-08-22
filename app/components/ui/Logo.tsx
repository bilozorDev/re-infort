import { cn } from "@/app/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

export function Logo({ size = "4xl", className }: LogoProps) {
  return (
    <span className={cn(sizeClasses[size], "font-bold text-gray-600", className)}>
      re<span className="animate-pulse text-gray-500">:</span>
      <span>infort</span>
    </span>
  );
}