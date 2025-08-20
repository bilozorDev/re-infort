"use client";

import {
  Label,
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { cn } from "@/app/lib/utils";

export interface ListboxOption {
  value: string;
  label: string;
}

export interface ListboxProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: ListboxOption[];
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
}

export const Listbox = forwardRef<{ value: string; setValue: (value: string) => void }, ListboxProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      options,
      placeholder = "Select an option",
      disabled,
      value = "",
      onChange,
      onBlur,
      name,
      className,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value);
    
    // Sync internal value when external value prop changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);
    
    // Get the selected option based on value
    const selectedOption = options.find((opt) => opt.value === (value ?? internalValue));

    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    // Expose value and setValue via ref for external control
    useImperativeHandle(ref, () => ({
      value: value ?? internalValue,
      setValue: (newValue: string) => {
        setInternalValue(newValue);
        onChange?.(newValue);
      },
    }));

    return (
      <div className={cn("w-full", className)}>
        <HeadlessListbox value={value ?? internalValue} onChange={handleChange} disabled={disabled}>
          {label && (
            <Label className="block text-sm/6 font-medium text-gray-900">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          <div className={label ? "relative mt-2" : "relative"}>
            <ListboxButton
              className={cn(
                "grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6",
                error && "outline-red-500 focus-visible:outline-red-500",
                disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
              )}
              onBlur={onBlur}
            >
              <span className={cn("col-start-1 row-start-1 truncate pr-6", !selectedOption && "text-gray-500")}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronUpDownIcon
                aria-hidden="true"
                className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
              />
            </ListboxButton>

            <ListboxOptions
              transition
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
            >
              {/* Add empty option if there's a placeholder */}
              {placeholder && (
                <ListboxOption
                  value=""
                  className="group relative cursor-default py-2 pr-4 pl-8 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                >
                  <span className="block truncate font-normal text-gray-500 group-data-focus:text-white">
                    {placeholder}
                  </span>
                </ListboxOption>
              )}
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="group relative cursor-default py-2 pr-4 pl-8 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                >
                  <span className="block truncate font-normal group-data-selected:font-semibold">
                    {option.label}
                  </span>
                  <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white">
                    <CheckIcon aria-hidden="true" className="size-5" />
                  </span>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </HeadlessListbox>
        {error && (
          <p id={`${name}-error`} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${name}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Listbox.displayName = "Listbox";