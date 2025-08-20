import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/app/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  orientation?: "horizontal" | "vertical";
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      orientation = "vertical",
      name,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    return (
      <fieldset className="w-full">
        {label && <legend className="text-sm/6 font-semibold text-gray-900">{label}</legend>}
        {helperText && !error && <p className="mt-1 text-sm/6 text-gray-600">{helperText}</p>}
        <div
          className={cn("mt-6", orientation === "vertical" ? "space-y-6" : "flex flex-wrap gap-6")}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-x-3">
              <input
                ref={option.value === options[0].value ? ref : undefined}
                id={`${name}-${option.value}`}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                className={cn(
                  "relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden",
                  error && "border-red-500",
                  className
                )}
                aria-describedby={
                  error
                    ? `${name}-error`
                    : option.description
                      ? `${name}-${option.value}-description`
                      : undefined
                }
                {...props}
              />
              <div>
                <label
                  htmlFor={`${name}-${option.value}`}
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  {option.label}
                </label>
                {option.description && (
                  <p id={`${name}-${option.value}-description`} className="text-sm text-gray-500">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {error && (
          <p id={`${name}-error`} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
