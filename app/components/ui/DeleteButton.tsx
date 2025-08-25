"use client";

import { TrashIcon } from "@heroicons/react/24/outline";

import { cn } from "@/app/lib/utils";

interface DeleteButtonProps {
  onClick: () => void;
  variant?: "icon" | "text" | "icon-text";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  srText?: string;
}

export function DeleteButton({
  onClick,
  variant = "icon",
  size = "md",
  className,
  disabled = false,
  srText,
}: DeleteButtonProps) {
  const sizeClasses = {
    sm: {
      icon: "p-1.5",
      text: "px-2 py-1 text-xs",
      iconSize: "h-3 w-3",
    },
    md: {
      icon: "p-2",
      text: "px-3 py-1.5 text-sm",
      iconSize: "h-4 w-4",
    },
    lg: {
      icon: "p-2.5",
      text: "px-4 py-2 text-base",
      iconSize: "h-5 w-5",
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === "text") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "text-red-600 hover:text-red-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          currentSize.text,
          className
        )}
      >
        Delete{srText && <span className="sr-only">, {srText}</span>}
      </button>
    );
  }

  if (variant === "icon-text") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-x-1.5 rounded-md bg-white shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 text-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          currentSize.text,
          className
        )}
      >
        <TrashIcon className={cn("-ml-0.5", currentSize.iconSize)} />
        Delete{srText && <span className="sr-only">, {srText}</span>}
      </button>
    );
  }

  // Default: icon variant (baseline from services)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md bg-white shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed",
        currentSize.icon,
        className
      )}
      title="Delete"
    >
      <TrashIcon className={currentSize.iconSize} />
      {srText && <span className="sr-only">Delete {srText}</span>}
    </button>
  );
}