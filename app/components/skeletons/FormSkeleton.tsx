"use client";

interface FormSkeletonProps {
  fields?: number;
  showButtons?: boolean;
  className?: string;
}

export function FormSkeleton({ 
  fields = 5, 
  showButtons = true,
  className = ""
}: FormSkeletonProps) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="space-y-6">
        {[...Array(fields)].map((_, index) => (
          <div key={`field-${index}`}>
            {/* Label */}
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
            {/* Input field */}
            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
            {/* Helper text */}
            {index % 2 === 0 && (
              <div className="h-3 bg-gray-100 rounded animate-pulse w-48 mt-1" />
            )}
          </div>
        ))}
        
        {/* Checkbox/Toggle section */}
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        </div>
        
        {showButtons && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <div className="h-10 w-20 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-10 w-24 bg-indigo-100 rounded-md animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}