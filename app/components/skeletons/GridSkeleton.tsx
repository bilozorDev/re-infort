"use client";

interface GridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
}

export function GridSkeleton({ 
  items = 6, 
  columns = 3,
  className = ""
}: GridSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-${columns} ${className}`}>
      {[...Array(items)].map((_, index) => (
        <div
          key={`grid-item-${index}`}
          className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 p-6"
        >
          {/* Image placeholder */}
          <div className="aspect-w-16 aspect-h-9 mb-4">
            <div className="bg-gray-200 rounded-lg animate-pulse w-full h-48" />
          </div>
          
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
          
          {/* Subtitle/Description */}
          <div className="h-4 bg-gray-100 rounded animate-pulse mb-1 w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse mb-4 w-1/2" />
          
          {/* Meta info */}
          <div className="flex justify-between items-center">
            <div className="h-6 w-20 bg-indigo-50 rounded-md animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
          
          {/* Action buttons */}
          <div className="mt-4 flex space-x-2">
            <div className="h-9 bg-gray-100 rounded-md animate-pulse flex-1" />
            <div className="h-9 w-9 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}