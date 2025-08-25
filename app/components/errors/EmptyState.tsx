"use client";

import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  children,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </button>
        </div>
      )}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}