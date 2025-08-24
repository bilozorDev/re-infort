"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { PageHeader } from "@/app/components/ui/page-header";
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
      <PageHeader
        title="Warehouses"
        description="Manage your inventory locations and warehouses"
        primaryAction={isAdmin && hasWarehouses ? {
          label: "Add Warehouse",
          onClick: () => setShowForm(true),
          icon: PlusIcon,
        } : undefined}
      />

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
