"use client";

import { ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { LowStockAlertsSkeleton } from "@/app/components/skeletons/LowStockAlertsSkeleton";
import { StockAdjustmentModal } from "@/app/dashboard/products/[id]/components/StockAdjustmentModal";

interface LowStockItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  current_quantity: number;
  low_stock_threshold: number;
  total_quantity: number;
}

interface LowStockAlertsProps {
  items: LowStockItem[];
  isAdmin: boolean;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function LowStockAlertsContent({ items, isAdmin, isLoading, error, onRetry }: LowStockAlertsProps) {
  const [selectedProduct, setSelectedProduct] = useState<{ productId: string; warehouseId: string } | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  const handleRestock = (productId: string, warehouseId: string) => {
    setSelectedProduct({ productId, warehouseId });
    setAdjustmentModalOpen(true);
  };

  if (isLoading) {
    return <LowStockAlertsSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load alerts</h3>
          <p className="mt-1 text-sm text-gray-500">We couldn&apos;t fetch low stock alerts.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {items.length}
            </span>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert Threshold
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.slice(0, 10).map((item) => (
                  <tr key={`${item.product_id}-${item.warehouse_id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/products/${item.product_id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {item.product_name}
                      </Link>
                      <div className="text-xs text-gray-500">{item.product_sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.warehouse_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        item.current_quantity === 0 ? "text-red-600" : "text-yellow-600"
                      }`}>
                        {item.current_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.total_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {item.low_stock_threshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin && (
                        <button
                          onClick={() => handleRestock(item.product_id, item.warehouse_id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span className="sr-only">Restock</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">All items are adequately stocked</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentModalOpen && selectedProduct && (
        <StockAdjustmentModal
          productId={selectedProduct.productId}
          warehouseId={selectedProduct.warehouseId}
          type="add"
          isOpen={adjustmentModalOpen}
          onClose={() => {
            setAdjustmentModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}

// Export with ErrorBoundary wrapper
export function LowStockAlerts(props: LowStockAlertsProps) {
  return (
    <ErrorBoundary
      level="section"
      resetKeys={[props.items?.length]}
      onError={(error) => {
        console.error("LowStockAlerts error:", error);
      }}
    >
      <LowStockAlertsContent {...props} />
    </ErrorBoundary>
  );
}