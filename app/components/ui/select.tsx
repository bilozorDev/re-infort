"use client";

import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/app/utils/cn";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface SelectValueProps {
  placeholder?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  options: Map<string, string>;
  placeholder?: string;
}>({
  value: undefined,
  onValueChange: undefined,
  options: new Map(),
  placeholder: undefined,
});

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [options] = React.useState(new Map<string, string>());
  const [placeholder, setPlaceholder] = React.useState<string>();

  return (
    <SelectContext.Provider value={{ value, onValueChange, options, placeholder }}>
      <Listbox value={value} onChange={onValueChange} disabled={disabled}>
        {({ open }) => <div className="relative">{children}</div>}
      </Listbox>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const { value, options } = React.useContext(SelectContext);
  const [displayPlaceholder, setDisplayPlaceholder] = React.useState<string>("Select...");
  
  // Extract placeholder from SelectValue child
  React.useEffect(() => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectValue) {
        if (child.props.placeholder) {
          setDisplayPlaceholder(child.props.placeholder);
        }
      }
    });
  }, [children]);

  return (
    <Listbox.Button
      className={cn(
        "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6",
        className
      )}
    >
      <span className="block truncate">
        {value ? options.get(value) || value : displayPlaceholder}
      </span>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>
    </Listbox.Button>
  );
}

export function SelectContent({ children, className }: SelectContentProps) {
  return (
    <Transition
      as={React.Fragment}
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Listbox.Options
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
          className
        )}
      >
        {children}
      </Listbox.Options>
    </Transition>
  );
}

export function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  const { options } = React.useContext(SelectContext);
  
  React.useEffect(() => {
    if (typeof children === "string") {
      options.set(value, children);
    }
  }, [value, children, options]);

  return (
    <Listbox.Option
      value={value}
      disabled={disabled}
      className={({ active, selected }) =>
        cn(
          "relative cursor-default select-none py-2 pl-3 pr-9",
          active ? "bg-indigo-600 text-white" : "text-gray-900",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )
      }
    >
      {({ selected, active }) => (
        <>
          <span className={cn("block truncate", selected ? "font-semibold" : "font-normal")}>
            {children}
          </span>
          {selected && (
            <span
              className={cn(
                "absolute inset-y-0 right-0 flex items-center pr-4",
                active ? "text-white" : "text-indigo-600"
              )}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </Listbox.Option>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const ctx = React.useContext(SelectContext);
  
  React.useEffect(() => {
    if (placeholder && ctx) {
      // Store placeholder in context
      (ctx as any).placeholder = placeholder;
    }
  }, [placeholder, ctx]);
  
  return null;
}

// Export these for compatibility but they're not used with Headless UI
export const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="py-1.5 pl-3 pr-2 text-xs font-semibold text-gray-900">{children}</div>
);
export const SelectSeparator = () => <hr className="my-1 h-px bg-gray-200" />;