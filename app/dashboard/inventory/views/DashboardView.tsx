"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface DashboardViewProps {
  isAdmin: boolean;
  organizationId: string;
}

export function DashboardView({}: DashboardViewProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Inventory Dashboard Coming Soon</h3>
      <p className="mt-2 text-sm text-gray-500">
        This dashboard will provide real-time insights into your inventory including stock levels, low stock alerts, recent movements, and top moving products.
      </p>
    </div>
  );
}