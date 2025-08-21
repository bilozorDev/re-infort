"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { cloneElement, type ReactElement } from "react";

interface FormFieldProps {
  field: AnyFieldApi;
  children: ReactElement;
  showError?: boolean;
}

// Define the props we'll pass to child components
interface ChildProps {
  name: string;
  value: unknown;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown) => void;
  onBlur: () => void;
  error?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Wrapper component that connects TanStack Form fields with our UI components
 * Automatically handles value, onChange, onBlur, and error states
 */
export function FormField({ field, children, showError = true }: FormFieldProps) {
  const error =
    showError && field.state.meta.errors.length > 0
      ? field.state.meta.errors.join(", ")
      : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown) => {
    // Handle different input types
    if (!e || typeof e !== 'object') {
      field.handleChange(e);
      return;
    }
    
    if (!('target' in e)) {
      // This handles direct value changes from components like Listbox
      field.handleChange(e);
      return;
    }
    
    const event = e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    const target = event.target;
    
    // Check if it's an input element with a type
    if (target instanceof HTMLInputElement) {
      if (target.type === "checkbox") {
        field.handleChange(target.checked);
      } else if (target.type === "number") {
        field.handleChange(target.valueAsNumber || 0);
      } else {
        field.handleChange(target.value);
      }
    } else if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      field.handleChange(target.value);
    } else {
      // Fallback for unknown target types
      field.handleChange((target as HTMLInputElement).value);
    }
  };

  const childProps: ChildProps = {
    name: field.name,
    value: field.state.value,
    onChange: handleChange,
    onBlur: field.handleBlur,
    error,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${field.name}-error` : undefined,
  };

  // Check if the child is a checkbox component and add checked prop
  const childType = children.type;
  const isCheckbox = childType && 
    (typeof childType === 'function' && 
     ((childType as React.ComponentType & { displayName?: string }).displayName === 'Checkbox' || 
      childType.name === 'Checkbox')) ||
    (children.props && (children.props as Record<string, unknown>).type === 'checkbox');
  
  interface CheckboxChildProps extends ChildProps {
    checked?: boolean;
  }
  
  if (isCheckbox) {
    (childProps as CheckboxChildProps).checked = field.state.value as boolean;
  }

  // Merge with existing props to preserve things like disabled, placeholder, etc.
  const mergedProps = Object.assign({}, children.props, childProps);
  return cloneElement(children, mergedProps);
}