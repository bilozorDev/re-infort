"use client";

export default function ServiceStatsSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-8 w-16 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}