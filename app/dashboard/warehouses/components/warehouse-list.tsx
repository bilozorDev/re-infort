"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";

import { DeleteButton } from "@/app/components/ui/DeleteButton";
import { EditButton } from "@/app/components/ui/EditButton";
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
                    <EditButton
                      onClick={() => onEdit(warehouse.id)}
                      variant="icon"
                      size="md"
                      className="text-gray-400 hover:text-gray-500"
                      srText={warehouse.name}
                    />
                    <DeleteButton
                      onClick={() => handleDelete(warehouse)}
                      variant="icon"
                      size="md"
                      className="text-gray-400 hover:text-red-500"
                      srText={warehouse.name}
                    />
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
