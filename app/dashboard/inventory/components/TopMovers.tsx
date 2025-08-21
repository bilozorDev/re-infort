"use client";

import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface TopMover {
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_count: number;
  total_quantity: number;
  trend: "up" | "down" | "stable";
}

interface TopMoversProps {
  items: TopMover[];
}

export function TopMovers({ items }: TopMoversProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Top Moving Products</h3>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="px-6 py-4">
          <div className="space-y-3">
            {items.slice(0, 5).map((item, index) => (
              <div key={item.product_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div>
                    <Link
                      href={`/dashboard/products/${item.product_id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {item.product_name}
                    </Link>
                    <div className="text-xs text-gray-500">{item.product_sku}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.total_quantity} units
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.movement_count} movements
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No movement data available</p>
        </div>
      )}
    </div>
  );
}