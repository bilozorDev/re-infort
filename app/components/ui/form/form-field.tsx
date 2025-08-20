'use client';

import type { FieldApi } from '@tanstack/react-form';
import { cloneElement,type ReactElement } from 'react';

interface FormFieldProps {
  field: FieldApi<any, any, any, any>;
  children: ReactElement;
  showError?: boolean;
}

/**
 * Wrapper component that connects TanStack Form fields with our UI components
 * Automatically handles value, onChange, onBlur, and error states
 */
export function FormField({ field, children, showError = true }: FormFieldProps) {
  const error = showError && field.state.meta.errors.length > 0 
    ? field.state.meta.errors.join(', ')
    : undefined;

  return cloneElement(children, {
    id: field.name,
    name: field.name,
    value: field.state.value,
    onChange: (e: any) => {
      // Handle different input types
      if (e?.target?.type === 'checkbox') {
        field.handleChange(e.target.checked);
      } else if (e?.target?.type === 'number') {
        field.handleChange(e.target.valueAsNumber);
      } else if (e?.target) {
        field.handleChange(e.target.value);
      } else {
        field.handleChange(e);
      }
    },
    onBlur: field.handleBlur,
    error,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${field.name}-error` : undefined,
  });
}