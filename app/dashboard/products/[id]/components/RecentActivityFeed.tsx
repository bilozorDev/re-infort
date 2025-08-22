"use client";

import {
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  ArrowUpIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

import { useRecentMovements } from "@/app/hooks/use-stock-movements";
import { formatDate } from "@/app/lib/utils/table";

interface RecentActivityFeedProps {
  productId: string;
}

export function RecentActivityFeed({ productId }: RecentActivityFeedProps) {
  const { data: movements, isLoading } = useRecentMovements(productId, 5);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "receipt":
      case "return":
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
      case "sale":
      case "damage":
      case "production":
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
      case "transfer":
        return <ArrowsRightLeftIcon className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <PencilIcon className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getMovementText = (movement: {
    movement_type: string;
    quantity: number;
    to_warehouse_name?: string | null;
    from_warehouse_name?: string | null;
    from_warehouse_id?: string | null;
  }) => {
    const quantity = movement.quantity;
    switch (movement.movement_type) {
      case "receipt":
        return `Received ${quantity} units at ${movement.to_warehouse_name}`;
      case "sale":
        return `Sold ${quantity} units from ${movement.from_warehouse_name}`;
      case "transfer":
        return `Transferred ${quantity} units from ${movement.from_warehouse_name} to ${movement.to_warehouse_name}`;
      case "adjustment":
        return movement.from_warehouse_id
          ? `Adjusted -${quantity} units at ${movement.from_warehouse_name}`
          : `Adjusted +${quantity} units at ${movement.to_warehouse_name}`;
      case "return":
        return `Returned ${quantity} units to ${movement.to_warehouse_name}`;
      case "damage":
        return `Removed ${quantity} damaged units from ${movement.from_warehouse_name}`;
      case "production":
        return `Used ${quantity} units in production from ${movement.from_warehouse_name}`;
      default:
        return `${movement.movement_type}: ${quantity} units`;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : movements && movements.length > 0 ? (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getMovementIcon(movement.movement_type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{getMovementText(movement)}</p>
                  {movement.reason && (
                    <p className="text-xs text-gray-500 mt-1">Reason: {movement.reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(movement.created_at)}
                    {movement.created_by_name && (
                      <span className="ml-2">by {movement.created_by_name}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}
