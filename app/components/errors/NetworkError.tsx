"use client";

import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ 
  message = "Unable to connect to the server. Please check your internet connection.",
  onRetry,
  className = ""
}: NetworkErrorProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}