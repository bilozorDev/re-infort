"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface MovementsViewProps {
  isAdmin: boolean;
}

export function MovementsView({}: MovementsViewProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Stock Movements Coming Soon</h3>
      <p className="mt-2 text-sm text-gray-500">
        This feature will allow you to track all inventory movements including stock in, stock out, transfers, and adjustments.
      </p>
    </div>
  );
}