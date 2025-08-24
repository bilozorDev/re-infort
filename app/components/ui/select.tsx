"use client";

import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
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
  const [placeholder] = React.useState<string>();

  return (
    <SelectContext.Provider value={{ value, onValueChange, options, placeholder }}>
      <Listbox value={value} onChange={onValueChange} disabled={disabled}>
        {() => <div className="relative">{children}</div>}
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
        const props = child.props as { placeholder?: string };
        if (props.placeholder) {
          setDisplayPlaceholder(props.placeholder);
        }
      }
    });
  }, [children]);

  // Get display text - use the mapped option text if available, otherwise capitalize the value
  const getDisplayText = () => {
    if (!value) return displayPlaceholder;
    
    // First check if we have a mapped option
    const mappedText = options.get(value);
    if (mappedText) return mappedText;
    
    // Otherwise, capitalize the value for common cases
    if (typeof value === 'string') {
      // Handle common status values
      const commonMappings: Record<string, string> = {
        'active': 'Active',
        'inactive': 'Inactive',
        'all': 'All',
        'pending': 'Pending',
        'draft': 'Draft',
        'in-stock': 'In Stock',
        'out-of-stock': 'Out of Stock',
        'low-stock': 'Low Stock',
        'org:admin': 'Admin',
        'org:member': 'Member'
      };
      
      return commonMappings[value.toLowerCase()] || value;
    }
    
    return value;
  };

  return (
    <Listbox.Button
      className={cn(
        "grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6",
        className
      )}
    >
      <span className="col-start-1 row-start-1 truncate pr-6">
        {getDisplayText()}
      </span>
      <ChevronUpDownIcon
        aria-hidden="true"
        className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
      />
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
          "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm",
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
      className={cn(
        "group relative cursor-default py-2 pr-4 pl-8 text-gray-900 select-none hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white focus:outline-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {({ selected }) => (
        <>
          <span className={cn("block truncate font-normal", selected && "font-semibold")}>
            {children}
          </span>
          <span
            className={cn(
              "absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600 group-hover:text-white group-focus:text-white",
              !selected && "hidden"
            )}
          >
            <CheckIcon aria-hidden="true" className="size-5" />
          </span>
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
      const contextWithPlaceholder = ctx as typeof ctx & { placeholder?: string };
      contextWithPlaceholder.placeholder = placeholder;
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