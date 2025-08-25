"use client";

export function LowStockAlertsSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-5 w-5 bg-yellow-200 rounded animate-pulse mr-2" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
          <div className="ml-2 h-5 w-8 bg-yellow-100 rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24 ml-auto" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20 ml-auto" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24 ml-auto" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={`alert-row-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="h-4 bg-indigo-100 rounded animate-pulse w-32 mb-1" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-6 bg-red-50 rounded-full animate-pulse w-12 ml-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-12 ml-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-12 ml-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <div className="h-8 w-20 bg-indigo-100 rounded animate-pulse" />
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