"use client";

interface StatCardSkeletonProps {
  count?: number;
  className?: string;
}

export function StatCardSkeleton({ 
  count = 4,
  className = ""
}: StatCardSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-${count} ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div
          key={`stat-${index}`}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gray-200 rounded-md animate-pulse" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20" />
                <div className="flex items-baseline">
                  <div className="h-7 bg-gray-300 rounded animate-pulse w-16 mr-2" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}