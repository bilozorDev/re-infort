"use client";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showActions = true,
  className = ""
}: TableSkeletonProps) {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(columns)].map((_, index) => (
                <th
                  key={`header-${index}`}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-gray-50">
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {colIndex === 0 && (
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3" />
                      )}
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                        {colIndex === 0 && (
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                        )}
                      </div>
                    </div>
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}