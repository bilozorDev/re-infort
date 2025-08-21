"use client";

import { ArrowsRightLeftIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { type ProductInventorySummary } from "@/app/types/inventory";

import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { TransferModal } from "./TransferModal";

interface StockSummaryCardProps {
  productId: string;
  inventory?: ProductInventorySummary;
  isLoading: boolean;
  isAdmin: boolean;
}

export function StockSummaryCard({ productId, inventory, isLoading, isAdmin }: StockSummaryCardProps) {
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");

  const openAdjustmentModal = (type: "add" | "remove") => {
    setAdjustmentType(type);
    setAdjustmentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32" />
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const totalQuantity = inventory?.total_quantity || 0;
  const totalReserved = inventory?.total_reserved || 0;
  const totalAvailable = inventory?.total_available || 0;
  const warehouseCount = inventory?.warehouse_count || 0;

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Summary</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Total Stock</dt>
              <dd className="text-sm text-gray-900 font-semibold">{totalQuantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Available</dt>
              <dd className="text-sm text-green-600 font-semibold">{totalAvailable}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Reserved</dt>
              <dd className="text-sm text-yellow-600 font-semibold">{totalReserved}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Warehouses</dt>
              <dd className="text-sm text-gray-900">{warehouseCount}</dd>
            </div>
          </dl>

          {/* Stock by Warehouse */}
          {inventory?.warehouses && inventory.warehouses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">By Warehouse</h4>
              <div className="space-y-2">
                {inventory.warehouses.map((warehouse: { warehouse_id: string; warehouse_name: string; quantity: number }) => (
                  <div key={warehouse.warehouse_id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{warehouse.warehouse_name}</span>
                    <span className="text-gray-900 font-medium">{warehouse.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => openAdjustmentModal("add")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Stock
              </button>
              <button
                onClick={() => openAdjustmentModal("remove")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <MinusIcon className="h-4 w-4" />
                Remove Stock
              </button>
              <button
                onClick={() => setTransferModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
                disabled={warehouseCount < 2}
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                Transfer Stock
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {adjustmentModalOpen && (
        <StockAdjustmentModal
          productId={productId}
          type={adjustmentType}
          isOpen={adjustmentModalOpen}
          onClose={() => setAdjustmentModalOpen(false)}
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