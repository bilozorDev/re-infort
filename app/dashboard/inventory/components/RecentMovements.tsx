"use client";

import { ArrowDownIcon, ArrowsRightLeftIcon, ArrowUpIcon, PencilIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { formatDate } from "@/app/lib/utils/table";

interface Movement {
  id: string;
  movement_type: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  from_warehouse_name: string | null;
  to_warehouse_name: string | null;
  quantity: number;
  created_at: string;
  created_by: string;
}

interface RecentMovementsProps {
  movements: Movement[];
  isAdmin: boolean;
}

export function RecentMovements({ movements }: RecentMovementsProps) {
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

  const getMovementBadgeColor = (type: string) => {
    switch (type) {
      case "receipt":
      case "return":
        return "bg-green-100 text-green-800";
      case "sale":
      case "damage":
      case "production":
        return "bg-red-100 text-red-800";
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "adjustment":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMovementDescription = (movement: Movement) => {
    switch (movement.movement_type) {
      case "transfer":
        return `${movement.from_warehouse_name} → ${movement.to_warehouse_name}`;
      case "receipt":
      case "return":
        return `To ${movement.to_warehouse_name}`;
      case "sale":
      case "damage":
      case "production":
      case "adjustment":
        return `From ${movement.from_warehouse_name || movement.to_warehouse_name}`;
      default:
        return "-";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Movements</h3>
        <Link
          href="/dashboard/inventory?tab=movements"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          View all
        </Link>
      </div>

      {movements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Movement
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.slice(0, 10).map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMovementIcon(movement.movement_type)}
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementBadgeColor(
                          movement.movement_type
                        )}`}
                      >
                        {movement.movement_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/products/${movement.product_id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      {movement.product_name}
                    </Link>
                    <div className="text-xs text-gray-500">{movement.product_sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMovementDescription(movement)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(movement.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No recent movements</p>
        </div>
      )}
    </div>
  );
}