"use client";

export function ProductTableSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(10)].map((_, index) => (
              <tr key={`product-row-${index}`} className="hover:bg-gray-50">
                {/* Image & Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="ml-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                    </div>
                  </div>
                </td>
                {/* Category */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-indigo-50 rounded-full animate-pulse w-20" />
                </td>
                {/* SKU */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                </td>
                {/* Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                </td>
                {/* Cost */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                </td>
                {/* Stock */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-green-50 rounded-full animate-pulse w-16" />
                </td>
                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" />
                </td>
                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}