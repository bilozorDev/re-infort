"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface ReportsViewProps {
  organizationId: string;
}

export function ReportsView({}: ReportsViewProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Inventory Reports Coming Soon</h3>
      <p className="mt-2 text-sm text-gray-500">
        This feature will provide comprehensive reporting including stock summaries, movement history, low stock alerts, and inventory valuation reports.
      </p>
    </div>
  );
}