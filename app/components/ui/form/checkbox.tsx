import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/app/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    return (
      <div className="flex gap-3">
        <div className="flex h-6 shrink-0 items-center">
          <div className="group grid size-4 grid-cols-1">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              className={cn(
                "col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto",
                error && "border-red-500",
                className
              )}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id}-error` : description ? `${id}-description` : undefined
              }
              {...props}
            />
            <svg
              fill="none"
              viewBox="0 0 14 14"
              className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
            >
              <path
                d="M3 8L6 11L11 3.5"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-0 group-has-checked:opacity-100"
              />
              <path
                d="M3 7H11"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-0 group-has-indeterminate:opacity-100"
              />
            </svg>
          </div>
        </div>
        {(label || description) && (
          <div className="text-sm/6">
            {label && (
              <label htmlFor={id} className="font-medium text-gray-900">
                {label}
              </label>
            )}
            {description && (
              <p id={`${id}-description`} className="text-gray-500">
                {description}
              </p>
            )}
            {error && (
              <p id={`${id}-error`} className="text-red-600 mt-1">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
