"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface StockLevelsViewProps {
  isAdmin: boolean;
  organizationId: string;
}

export function StockLevelsView({}: StockLevelsViewProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Stock Levels Coming Soon</h3>
      <p className="mt-2 text-sm text-gray-500">
        This feature will display detailed stock levels across all warehouses with filtering, searching, and export capabilities.
      </p>
    </div>
  );
}