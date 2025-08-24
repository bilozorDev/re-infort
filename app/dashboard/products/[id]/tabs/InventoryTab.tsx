"use client";

import { ArrowsRightLeftIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useProductWarehouseInventory } from "@/app/hooks/use-inventory";
import { formatDate } from "@/app/lib/utils/table";

import { StockAdjustmentModal } from "../components/StockAdjustmentModal";
import { TransferModal } from "../components/TransferModal";

interface InventoryTabProps {
  productId: string;
  isAdmin: boolean;
}

export function InventoryTab({ productId, isAdmin }: InventoryTabProps) {
  const { data: inventory, isLoading } = useProductWarehouseInventory(productId);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const openAdjustmentModal = (warehouseId: string, type: "add" | "remove") => {
    setSelectedWarehouse(warehouseId);
    setAdjustmentType(type);
    setAdjustmentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Warehouse Inventory</h3>
          {isAdmin && inventory && inventory.length > 1 && (
            <button
              onClick={() => setTransferModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              Transfer Between Warehouses
            </button>
          )}
        </div>

        {inventory && inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Since
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.warehouse_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.warehouse_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.warehouse_status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.warehouse_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-semibold ${
                            isOutOfStock
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.reserved_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {item.available_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location_details || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.since_date)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openAdjustmentModal(item.warehouse_id, "add")}
                            className="text-green-600 hover:text-green-900"
                            title="Add stock"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openAdjustmentModal(item.warehouse_id, "remove")}
                            className="text-red-600 hover:text-red-900"
                            disabled={item.available_quantity === 0}
                            title="Remove stock"
                          >
                            <MinusIcon className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No inventory found for this product</p>
            {isAdmin && (
              <p className="mt-2 text-sm text-gray-500">
                Add stock to a warehouse to start tracking inventory
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {adjustmentModalOpen && (
        <StockAdjustmentModal
          productId={productId}
          warehouseId={selectedWarehouse}
          type={adjustmentType}
          isOpen={adjustmentModalOpen}
          onClose={() => {
            setAdjustmentModalOpen(false);
            setSelectedWarehouse(null);
          }}
        />
      )}

      {transferModalOpen && (
        <TransferModal
          productId={productId}
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
        />
      )}
    </>
  );
}