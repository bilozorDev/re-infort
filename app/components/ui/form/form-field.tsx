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

  return cloneElement(children, childProps);
}