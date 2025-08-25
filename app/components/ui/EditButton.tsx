"use client";

import { PencilIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

import { cn } from "@/app/lib/utils";

interface EditButtonProps {
  onClick: () => void;
  variant?: "icon" | "text" | "icon-text";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  srText?: string;
}

export function EditButton({
  onClick,
  variant = "icon",
  size = "md",
  className,
  disabled = false,
  srText,
}: EditButtonProps) {
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
          "text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          currentSize.text,
          className
        )}
      >
        Edit{srText && <span className="sr-only">, {srText}</span>}
      </button>
    );
  }

  if (variant === "icon-text") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-x-1.5 rounded-md bg-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          currentSize.text,
          className
        )}
      >
        <PencilIcon className={cn("-ml-0.5", currentSize.iconSize)} />
        Edit{srText && <span className="sr-only">, {srText}</span>}
      </button>
    );
  }

  // Default: icon variant (baseline from services)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md bg-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
        currentSize.icon,
        className
      )}
      title="Edit"
    >
      <PencilSquareIcon className={currentSize.iconSize} />
      {srText && <span className="sr-only">Edit {srText}</span>}
    </button>
  );
}