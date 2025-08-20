"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

import { useDeleteWarehouse } from "@/app/hooks/use-warehouses";
import { type Warehouse } from "@/app/types/warehouse";

interface WarehouseListProps {
  warehouses: Warehouse[];
  isAdmin: boolean;
  onEdit: (id: string) => void;
}

export function WarehouseList({ warehouses, isAdmin, onEdit }: WarehouseListProps) {
  const deleteWarehouse = useDeleteWarehouse();

  const handleDelete = async (warehouse: Warehouse) => {
    if (confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      deleteWarehouse.mutate(warehouse.id);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "office":
        return "Office";
      case "vehicle":
        return "Vehicle";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow-xs rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-base font-semibold text-gray-900">Warehouse Locations</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {warehouses.map((warehouse) => (
            <li key={warehouse.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {warehouse.status === "active" ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {warehouse.name}
                        {warehouse.is_default && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{getTypeLabel(warehouse.type)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {warehouse.address}, {warehouse.city}, {warehouse.state_province}{" "}
                      {warehouse.postal_code}
                    </p>
                    <p className="text-sm text-gray-500">{warehouse.country}</p>
                  </div>
                  {warehouse.notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">{warehouse.notes}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="ml-4 flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => onEdit(warehouse.id)}
                      className="rounded-md bg-white p-2 text-gray-400 shadow-xs ring-1 ring-gray-900/5 hover:text-gray-500"
                      title="Edit warehouse"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(warehouse)}
                      className="rounded-md bg-white p-2 text-gray-400 shadow-xs ring-1 ring-gray-900/5 hover:text-red-500"
                      title="Delete warehouse"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
