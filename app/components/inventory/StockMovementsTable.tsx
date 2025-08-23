"use client";

import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  ArrowUpIcon,
  FunnelIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { Select } from "@/app/components/ui/form/select";
import { TextField } from "@/app/components/ui/form/text-field";
import { ProductLink } from "@/app/components/ui/ProductLink";
import { useOrganizationMovements, useStockMovements } from "@/app/hooks/use-stock-movements";
import { useWarehouses } from "@/app/hooks/use-warehouses";
import { exportToCSV } from "@/app/lib/utils/export";
import { formatDate } from "@/app/lib/utils/table";

interface StockMovementsTableProps {
  productId?: string;
  showProductColumn?: boolean;
  initialFilters?: {
    type?: string;
    warehouse?: string;
  };
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

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

export function StockMovementsTable({
  productId,
  showProductColumn = true,
  initialFilters = {},
}: StockMovementsTableProps) {
  const [selectedType, setSelectedType] = useState(initialFilters.type || "all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialFilters.warehouse || "all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch warehouses for filter dropdown
  const { data: warehouses } = useWarehouses();

  // Build filters object
  const filters = useMemo(
    () => ({
      type: selectedType === "all" ? undefined : selectedType,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      warehouseId: selectedWarehouse === "all" ? undefined : selectedWarehouse,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
    }),
    [selectedType, selectedStatus, selectedWarehouse, dateRange]
  );

  // Use appropriate hook based on context
  const productMovementsQuery = useStockMovements(productId, filters);
  const orgMovementsQuery = useOrganizationMovements(filters);
  
  const { data: movements, isLoading } = productId ? productMovementsQuery : orgMovementsQuery;

  // Filter movements by search query
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    if (!searchQuery) return movements;

    const query = searchQuery.toLowerCase();
    return movements.filter(
      (movement) =>
        movement.product_name?.toLowerCase().includes(query) ||
        movement.product_sku?.toLowerCase().includes(query) ||
        movement.reference_number?.toLowerCase().includes(query) ||
        movement.reason?.toLowerCase().includes(query)
    );
  }, [movements, searchQuery]);

  // Calculate summary statistics
  const statistics = useMemo(() => {
    if (!filteredMovements || filteredMovements.length === 0) {
      return {
        total: 0,
        pending: 0,
        totalQuantity: 0,
        mostActiveType: "-",
      };
    }

    const pending = filteredMovements.filter((m) => m.status === "pending").length;
    const totalQuantity = filteredMovements.reduce((sum, m) => sum + m.quantity, 0);

    // Find most active movement type
    const typeCounts = filteredMovements.reduce((acc, m) => {
      acc[m.movement_type] = (acc[m.movement_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveType = Object.entries(typeCounts).reduce(
      (max, [type, count]) => (count > max.count ? { type, count } : max),
      { type: "-", count: 0 }
    ).type;

    return {
      total: filteredMovements.length,
      pending,
      totalQuantity,
      mostActiveType,
    };
  }, [filteredMovements]);

  const handleExport = () => {
    if (!filteredMovements || filteredMovements.length === 0) return;

    const csvData = filteredMovements.map((movement) => ({
      Date: formatDate(movement.created_at),
      Type: movement.movement_type,
      ...(showProductColumn && {
        Product: movement.product_name,
        SKU: movement.product_sku,
      }),
      Quantity: movement.quantity,
      "From Warehouse": movement.from_warehouse_name || "-",
      "To Warehouse": movement.to_warehouse_name || "-",
      Reference: movement.reference_number || "-",
      Reason: movement.reason || "-",
      Status: movement.status,
      "Created By": movement.created_by_name || movement.created_by_clerk_user_id || "Unknown",
    }));

    const filename = productId
      ? `stock-movements-${productId}-${Date.now()}.csv`
      : `stock-movements-all-${Date.now()}.csv`;

    exportToCSV(csvData, filename);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "receipt":
      case "return":
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
      case "sale":
      case "damage":
      case "production":
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
      case "transfer":
        return <ArrowsRightLeftIcon className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <PencilIcon className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-indigo-500 p-3">
                  <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Movements</dt>
                  <dd className="text-lg font-semibold text-gray-900">{statistics.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-yellow-500 p-3">
                  <FunnelIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">{statistics.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Quantity</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {statistics.totalQuantity.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-purple-500 p-3">
                  <ArrowUpIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Most Active</dt>
                  <dd className="text-lg font-semibold text-gray-900 capitalize">
                    {statistics.mostActiveType}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex flex-wrap gap-4 items-end">
          {!productId && (
            <div className="flex-1 min-w-[200px]">
              <TextField
                id="search"
                label="Search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product, SKU, or reference..."
              />
            </div>
          )}

          <div className="flex-1 min-w-[150px]">
            <Select
              id="movement-type"
              label="Movement Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={movementTypes}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select
              id="status"
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
            />
          </div>

          {warehouses && warehouses.length > 0 && (
            <div className="flex-1 min-w-[150px]">
              <Select
                id="warehouse"
                label="Warehouse"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                options={[
                  { value: "all", label: "All Warehouses" },
                  ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                ]}
              />
            </div>
          )}

          <div className="flex-1 min-w-[130px]">
            <TextField
              type="date"
              id="start-date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>

          <div className="flex-1 min-w-[130px]">
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
            disabled={!filteredMovements || filteredMovements.length === 0}
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
        ) : filteredMovements && filteredMovements.length > 0 ? (
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
                  {showProductColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                  )}
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
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMovementIcon(movement.movement_type)}
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementBadgeColor(
                            movement.movement_type
                          )}`}
                        >
                          {movement.movement_type}
                        </span>
                      </div>
                    </td>
                    {showProductColumn && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <ProductLink
                            productId={movement.product_id}
                            productName={movement.product_name}
                          />
                          <div className="text-xs text-gray-500">{movement.product_sku}</div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {movement.quantity.toLocaleString()}
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
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(
                          movement.status
                        )}`}
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
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Movements will appear here when stock is added, removed, or transferred"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}