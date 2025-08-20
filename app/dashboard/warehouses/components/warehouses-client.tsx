"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useWarehouses } from "@/app/hooks/use-warehouses";

import { EmptyState } from "./empty-state";
import { WarehouseForm } from "./warehouse-form";
import { WarehouseList } from "./warehouse-list";

interface WarehousesClientProps {
  isAdmin: boolean;
}

export function WarehousesClient({ isAdmin }: WarehousesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<string | null>(null);
  const { data: warehouses, isLoading, error } = useWarehouses();

  const handleEdit = (id: string) => {
    setEditingWarehouse(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWarehouse(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load warehouses. Please try again later.</p>
      </div>
    );
  }

  const hasWarehouses = warehouses && warehouses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your inventory locations and warehouses
          </p>
        </div>
        {isAdmin && hasWarehouses && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-4 w-4" />
            Add Warehouse
          </button>
        )}
      </div>

      {/* Content */}
      {hasWarehouses ? (
        <WarehouseList warehouses={warehouses} isAdmin={isAdmin} onEdit={handleEdit} />
      ) : (
        <EmptyState isAdmin={isAdmin} onAddWarehouse={() => setShowForm(true)} />
      )}

      {showForm && <WarehouseForm warehouseId={editingWarehouse} onClose={handleCloseForm} />}
    </div>
  );
}
