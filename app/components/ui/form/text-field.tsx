import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/app/lib/utils";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  required?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, helperText, prefix, required, id, value, ...props }, ref) => {
    // Convert null values to empty string to avoid React warnings
    const inputValue = value === null ? "" : value;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className={label ? "mt-2" : ""}>
          {prefix ? (
            <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
              <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                {prefix}
              </div>
              <input
                ref={ref}
                id={id}
                value={inputValue}
                className={cn(
                  "block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6",
                  className
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                {...props}
              />
            </div>
          ) : (
            <input
              ref={ref}
              id={id}
              value={inputValue}
              className={cn(
                "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6",
                error && "outline-red-500 focus:outline-red-500",
                className
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
              {...props}
            />
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${id}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
