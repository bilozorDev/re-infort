"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductLink } from "@/app/components/ui/ProductLink";
import { StockAdjustmentModal } from "@/app/dashboard/products/[id]/components/StockAdjustmentModal";
import { useCategories } from "@/app/hooks/use-categories";
import {
  type InventoryFilters,
  type OrganizationInventoryItem,
  useOrganizationInventory,
} from "@/app/hooks/use-inventory";
import { useWarehouses } from "@/app/hooks/use-warehouses";
import { formatDate } from "@/app/lib/utils/table";

interface StockLevelsViewProps {
  isAdmin: boolean;
  organizationId: string;
}

function StockStatusBadge({ status }: { status: string }) {
  const styles = {
    "in-stock": "bg-green-100 text-green-800",
    "low-stock": "bg-yellow-100 text-yellow-800",
    "out-of-stock": "bg-red-100 text-red-800",
  };

  const labels = {
    "in-stock": "In Stock",
    "low-stock": "Low Stock",
    "out-of-stock": "Out of Stock",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="divide-y divide-gray-200">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockLevelsView({ isAdmin }: StockLevelsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<InventoryFilters>(() => {
    const filterParam = searchParams.get("filter");
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    const warehouseParam = searchParams.get("warehouse");
    const sortParam = searchParams.get("sort");
    const orderParam = searchParams.get("order");
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    
    return {
      search: searchParam || "",
      stockStatus: filterParam === "low-stock" ? "low-stock" : 
                   filterParam === "out-of-stock" ? "out-of-stock" :
                   filterParam === "in-stock" ? "in-stock" : "all",
      categoryId: categoryParam || undefined,
      warehouseId: warehouseParam || undefined,
      sortBy: (sortParam as InventoryFilters["sortBy"]) || "product_name",
      sortOrder: (orderParam as "asc" | "desc") || "asc",
      page: pageParam ? parseInt(pageParam) : 1,
      pageSize: pageSizeParam ? parseInt(pageSizeParam) : 25,
    };
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // Show filters if any filter is active from URL
  const [showFilters, setShowFilters] = useState(() => {
    return !!(searchParams.get("filter") || searchParams.get("category") || searchParams.get("warehouse"));
  });
  const [adjustmentModal, setAdjustmentModal] = useState<{
    productId: string;
    warehouseId: string;
    type: "add" | "remove";
  } | null>(null);

  // Update filters when URL params change
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    const warehouseParam = searchParams.get("warehouse");
    
    setFilters(prev => ({
      ...prev,
      search: searchParam || "",
      stockStatus: filterParam === "low-stock" ? "low-stock" : 
                   filterParam === "out-of-stock" ? "out-of-stock" :
                   filterParam === "in-stock" ? "in-stock" : "all",
      categoryId: categoryParam || undefined,
      warehouseId: warehouseParam || undefined,
    }));
    
    // Show filters panel if any filter is active
    if (filterParam || categoryParam || warehouseParam) {
      setShowFilters(true);
    }
  }, [searchParams]);

  const { data: inventory, isLoading, error } = useOrganizationInventory(filters);
  const { data: categories } = useCategories();
  const { data: warehouses } = useWarehouses();

  // Update URL when filters change
  const updateURL = useCallback((newFilters: InventoryFilters) => {
    const params = new URLSearchParams();
    
    // Always keep the tab parameter
    params.set("tab", "stock-levels");
    
    // Add filter parameters
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.stockStatus && newFilters.stockStatus !== "all") {
      params.set("filter", newFilters.stockStatus);
    }
    if (newFilters.categoryId) params.set("category", newFilters.categoryId);
    if (newFilters.warehouseId) params.set("warehouse", newFilters.warehouseId);
    if (newFilters.sortBy && newFilters.sortBy !== "product_name") {
      params.set("sort", newFilters.sortBy);
    }
    if (newFilters.sortOrder && newFilters.sortOrder !== "asc") {
      params.set("order", newFilters.sortOrder);
    }
    if (newFilters.page && newFilters.page > 1) {
      params.set("page", newFilters.page.toString());
    }
    if (newFilters.pageSize && newFilters.pageSize !== 25) {
      params.set("pageSize", newFilters.pageSize.toString());
    }
    
    router.push(`/dashboard/inventory?${params.toString()}`);
  }, [router]);

  const handleSort = (column: typeof filters.sortBy) => {
    const newFilters: InventoryFilters = {
      ...filters,
      sortBy: column,
      sortOrder: (filters.sortBy === column && filters.sortOrder === "asc" ? "desc" : "asc") as "asc" | "desc",
      page: 1,
    };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSearch = useCallback((value: string) => {
    const newFilters = { ...filters, search: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  const handleFilterChange = (key: keyof InventoryFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const toggleRowExpansion = (productId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (!inventory?.items) return;

    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Subcategory",
      "Total Quantity",
      "Reserved",
      "Available",
      "Reorder Point",
      "Warehouse Count",
      "Status",
    ];

    const rows = inventory.items.map((item) => [
      item.product_name,
      item.product_sku,
      item.category_name,
      item.subcategory_name || "",
      item.total_quantity,
      item.total_reserved,
      item.total_available,
      item.reorder_point,
      item.warehouse_count,
      item.stock_status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory-levels-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stockStatusCounts = useMemo(() => {
    if (!inventory?.items) return { all: 0, "in-stock": 0, "low-stock": 0, "out-of-stock": 0 };

    const counts = inventory.items.reduce(
      (acc, item) => {
        acc.all++;
        acc[item.stock_status]++;
        return acc;
      },
      { all: 0, "in-stock": 0, "low-stock": 0, "out-of-stock": 0 }
    );

    return counts;
  }, [inventory]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Inventory</h3>
        <p className="mt-2 text-sm text-gray-500">
          {error instanceof Error ? error.message : "Failed to load inventory data"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by product name or SKU..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={exportToCSV}
              disabled={!inventory?.items.length}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                <div className="grid grid-cols-1">
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange("stockStatus", e.target.value)}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                  >
                    <option value="all">All ({stockStatusCounts.all})</option>
                    <option value="in-stock">In Stock ({stockStatusCounts["in-stock"]})</option>
                    <option value="low-stock">Low Stock ({stockStatusCounts["low-stock"]})</option>
                    <option value="out-of-stock">
                      Out of Stock ({stockStatusCounts["out-of-stock"]})
                    </option>
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="grid grid-cols-1">
                  <select
                    value={filters.categoryId || ""}
                    onChange={(e) => handleFilterChange("categoryId", e.target.value || undefined)}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                  >
                    <option value="">All Categories</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <div className="grid grid-cols-1">
                  <select
                    value={filters.warehouseId || ""}
                    onChange={(e) => handleFilterChange("warehouseId", e.target.value || undefined)}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                  >
                    <option value="">All Warehouses</option>
                    {warehouses?.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items per page
                </label>
                <div className="grid grid-cols-1">
                  <select
                    value={filters.pageSize}
                    onChange={(e) => handleFilterChange("pageSize", Number(e.target.value))}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading ? (
            <TableSkeleton />
          ) : inventory?.items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                {filters.search || filters.stockStatus !== "all"
                  ? "No inventory items match your filters"
                  : "No inventory items found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-8" />
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("product_name")}
                    >
                      <div className="flex items-center">
                        Product
                        <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center">
                        Category
                        <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("quantity")}
                    >
                      <div className="flex items-center justify-end">
                        Total Stock
                        <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reserved
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("available")}
                    >
                      <div className="flex items-center justify-end">
                        Available
                        <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouses
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("updated_at")}
                    >
                      <div className="flex items-center">
                        Last Updated
                        <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory?.items.map((item: OrganizationInventoryItem) => (
                    <React.Fragment key={item.product_id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-2">
                          <button
                            onClick={() => toggleRowExpansion(item.product_id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedRows.has(item.product_id) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <ProductLink
                              productId={item.product_id}
                              productName={item.product_name}
                            />
                            <div className="text-xs text-gray-500">{item.product_sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.category_name}</div>
                          {item.subcategory_name && (
                            <div className="text-xs text-gray-500">{item.subcategory_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span
                            className={`text-sm font-semibold ${
                              item.stock_status === "out-of-stock"
                                ? "text-red-600"
                                : item.stock_status === "low-stock"
                                  ? "text-yellow-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {item.total_quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {item.total_reserved.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {item.total_available.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-900">{item.warehouse_count}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StockStatusBadge status={item.stock_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.last_movement_date ? formatDate(item.last_movement_date) : "Never"}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {item.warehouses.length > 0 && (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setAdjustmentModal({
                                      productId: item.product_id,
                                      warehouseId: item.warehouses[0].warehouse_id,
                                      type: "add",
                                    })
                                  }
                                  className="text-green-600 hover:text-green-900"
                                  title="Add stock"
                                >
                                  <PlusIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setAdjustmentModal({
                                      productId: item.product_id,
                                      warehouseId: item.warehouses[0].warehouse_id,
                                      type: "remove",
                                    })
                                  }
                                  className="text-red-600 hover:text-red-900"
                                  disabled={item.total_available === 0}
                                  title="Remove stock"
                                >
                                  <MinusIcon className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                      {expandedRows.has(item.product_id) && (
                        <tr>
                          <td colSpan={isAdmin ? 11 : 10} className="px-6 py-4 bg-gray-50">
                            <div className="text-sm">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Warehouse Distribution
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.warehouses.map((warehouse) => (
                                  <div
                                    key={warehouse.warehouse_id}
                                    className="bg-white p-3 rounded border border-gray-200"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {warehouse.warehouse_name}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      <span>Qty: {warehouse.quantity}</span>
                                      <span className="mx-2">•</span>
                                      <span>Reserved: {warehouse.reserved}</span>
                                      <span className="mx-2">•</span>
                                      <span className="text-green-600">
                                        Available: {warehouse.available}
                                      </span>
                                    </div>
                                    {isAdmin && (
                                      <div className="mt-2 flex gap-2">
                                        <button
                                          onClick={() =>
                                            setAdjustmentModal({
                                              productId: item.product_id,
                                              warehouseId: warehouse.warehouse_id,
                                              type: "add",
                                            })
                                          }
                                          className="text-xs text-green-600 hover:text-green-900"
                                        >
                                          Add
                                        </button>
                                        <button
                                          onClick={() =>
                                            setAdjustmentModal({
                                              productId: item.product_id,
                                              warehouseId: warehouse.warehouse_id,
                                              type: "remove",
                                            })
                                          }
                                          className="text-xs text-red-600 hover:text-red-900"
                                          disabled={warehouse.available === 0}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {inventory && inventory.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(inventory.currentPage - 1)}
                  disabled={inventory.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(inventory.currentPage + 1)}
                  disabled={inventory.currentPage === inventory.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(inventory.currentPage - 1) * inventory.pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(inventory.currentPage * inventory.pageSize, inventory.totalItems)}
                    </span>{" "}
                    of <span className="font-medium">{inventory.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(inventory.currentPage - 1)}
                      disabled={inventory.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, inventory.totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === inventory.currentPage
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(inventory.currentPage + 1)}
                      disabled={inventory.currentPage === inventory.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentModal && (
        <StockAdjustmentModal
          productId={adjustmentModal.productId}
          warehouseId={adjustmentModal.warehouseId}
          type={adjustmentModal.type}
          isOpen={true}
          onClose={() => setAdjustmentModal(null)}
        />
      )}
    </>
  );
}
