"use client";

export default function ServiceListSkeleton() {
  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <ul role="list" className="divide-y divide-gray-100">
        {[...Array(5)].map((_, index) => (
          <li key={index} className="relative flex justify-between gap-x-6 px-4 py-5 sm:px-6">
            <div className="flex min-w-0 gap-x-4">
              {/* Icon skeleton */}
              <div className="h-12 w-12 flex-none rounded-full bg-gray-200 animate-pulse" />
              
              <div className="min-w-0 flex-auto">
                {/* Title skeleton */}
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                
                {/* Description skeleton */}
                <div className="mt-2 h-3 w-72 bg-gray-100 rounded animate-pulse" />
                
                {/* Meta info skeleton */}
                <div className="mt-3 flex items-center gap-x-4">
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-indigo-50 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Action buttons skeleton */}
            <div className="flex shrink-0 items-center gap-x-2">
              <div className="h-8 w-8 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}