"use client";

import { ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface DataErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  error?: Error | null;
  className?: string;
}

export function DataError({ 
  title = "Failed to load data",
  message = "We encountered an error while loading this information.",
  onRetry,
  showDetails = process.env.NODE_ENV === "development",
  error,
  className = ""
}: DataErrorProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex">
        <ExclamationCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {showDetails && error && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-500">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}