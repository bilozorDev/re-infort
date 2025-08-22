"use client";

import { ArrowDownTrayIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { Select } from "@/app/components/ui/form/select";
import { TextField } from "@/app/components/ui/form/text-field";
import { useStockMovements } from "@/app/hooks/use-stock-movements";
import { exportToCSV } from "@/app/lib/utils/export";
import { formatDate } from "@/app/lib/utils/table";

interface MovementsTabProps {
  productId: string;
}

const movementTypes = [
  { value: "all", label: "All Types" },
  { value: "receipt", label: "Receipts" },
  { value: "sale", label: "Sales" },
  { value: "transfer", label: "Transfers" },
  { value: "adjustment", label: "Adjustments" },
  { value: "return", label: "Returns" },
  { value: "damage", label: "Damage" },
  { value: "production", label: "Production" },
];

export function MovementsTab({ productId }: MovementsTabProps) {
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: movements, isLoading } = useStockMovements(productId, {
    type: selectedType === "all" ? undefined : selectedType,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
  });

  const handleExport = () => {
    if (!movements || movements.length === 0) return;

    const csvData = movements.map((movement) => ({
      Date: formatDate(movement.created_at),
      Type: movement.movement_type,
      Quantity: movement.quantity,
      "From Warehouse": movement.from_warehouse_name || "-",
      "To Warehouse": movement.to_warehouse_name || "-",
      Reference: movement.reference_number || "-",
      Reason: movement.reason || "-",
      Status: movement.status,
      "Created By": movement.created_by_name || movement.created_by_clerk_user_id || "Unknown",
    }));

    exportToCSV(csvData, `stock-movements-${productId}-${Date.now()}.csv`);
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

  const getMovementDirection = (movement: {
    movement_type: string;
    from_warehouse_id?: string | null;
    from_warehouse_name?: string | null;
    to_warehouse_id?: string | null;
    to_warehouse_name?: string | null;
  }) => {
    if (movement.movement_type === "transfer") {
      return `${movement.from_warehouse_name} → ${movement.to_warehouse_name}`;
    } else if (movement.from_warehouse_id) {
      return `From ${movement.from_warehouse_name}`;
    } else if (movement.to_warehouse_id) {
      return `To ${movement.to_warehouse_name}`;
    }
    return "-";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Select
              id="movement-type"
              label="Movement Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={movementTypes}
              placeholder="Select movement type"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <TextField
              type="date"
              id="start-date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <TextField
              type="date"
              id="end-date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>

          <button
            onClick={handleExport}
            disabled={!movements || movements.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12">
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : movements && movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementBadgeColor(
                          movement.movement_type
                        )}`}
                      >
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getMovementDirection(movement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reference_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={movement.reason || ""}>
                        {movement.reason || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          movement.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : movement.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {movement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.created_by_name || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No stock movements found</p>
            <p className="text-xs text-gray-400 mt-1">
              Movements will appear here when stock is added, removed, or transferred
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
