"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { DataError } from "@/app/components/errors/DataError";
import { WarehouseListSkeleton } from "@/app/components/skeletons/WarehouseListSkeleton";
import { PageHeader } from "@/app/components/ui/page-header";
import { useWarehouses } from "@/app/hooks/use-warehouses";

import { EmptyState } from "./empty-state";
import { WarehouseForm } from "./warehouse-form";
import { WarehouseList } from "./warehouse-list";

interface WarehousesClientProps {
  isAdmin: boolean;
}

function WarehousesClientContent({ isAdmin }: WarehousesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<string | null>(null);
  const { data: warehouses, isLoading, error, refetch } = useWarehouses();

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
      <div className="space-y-6">
        <PageHeader
          title="Warehouses"
          description="Manage your inventory locations and warehouses"
        />
        <WarehouseListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Warehouses"
          description="Manage your inventory locations and warehouses"
        />
        <DataError
          title="Failed to load warehouses"
          message="We couldn't fetch your warehouse list. Please check your connection and try again."
          error={error as Error}
          onRetry={() => refetch()}
        />
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

      {showForm && <WarehouseForm key={editingWarehouse || 'new'} warehouseId={editingWarehouse} onClose={handleCloseForm} />}
    </div>
  );
}

// Export with ErrorBoundary wrapper
export function WarehousesClient(props: WarehousesClientProps) {
  return (
    <ErrorBoundary
      level="page"
      onError={(error) => {
        console.error("WarehousesClient error:", error);
      }}
    >
      <WarehousesClientContent {...props} />
    </ErrorBoundary>
  );
}
