"use client";

export function WarehouseListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div
          key={`warehouse-${index}`}
          className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-100 rounded-lg animate-pulse mr-3" />
                <div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-1" />
                  <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" />
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="mb-4">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-16 mb-1" />
                <div className="h-5 bg-gray-200 rounded animate-pulse w-12" />
              </div>
              <div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20 mb-1" />
                <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            </div>
            
            {/* Manager */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse mr-2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <div className="h-9 bg-gray-100 rounded-md animate-pulse flex-1" />
              <div className="h-9 bg-gray-100 rounded-md animate-pulse flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}