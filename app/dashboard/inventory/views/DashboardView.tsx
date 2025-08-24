"use client";

import {
  ArchiveBoxIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo } from "react";

import { LowStockAlerts } from "@/app/dashboard/inventory/components/LowStockAlerts";
import { RecentMovements } from "@/app/dashboard/inventory/components/RecentMovements";
import { TopMovers } from "@/app/dashboard/inventory/components/TopMovers";
import { useOrganizationInventory } from "@/app/hooks/use-inventory";
import { useProducts } from "@/app/hooks/use-products";
import { useMovementStatistics, useOrganizationMovements } from "@/app/hooks/use-stock-movements";
import { useWarehouses } from "@/app/hooks/use-warehouses";

interface DashboardViewProps {
  isAdmin: boolean;
  organizationId: string;
}

export function DashboardView({ isAdmin }: DashboardViewProps) {
  // Fetch all necessary data
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: organizationInventory, isLoading: orgInventoryLoading } = useOrganizationInventory();
  // We'll use organizationInventory for low stock alerts since it includes warehouse details
  
  // Get recent movements (last 7 days)
  const { data: recentMovements, isLoading: movementsLoading } = useOrganizationMovements({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  
  // Get movement statistics (last 30 days)
  const { data: movementStats, isLoading: statsLoading } = useMovementStatistics("30d");

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    if (!products || !organizationInventory?.items || !warehouses) {
      return null;
    }

    // Calculate total stock across all products
    const totalStock = organizationInventory.items.reduce((sum, item) => sum + item.total_quantity, 0);
    
    // Calculate stock value (if we have cost data)
    const stockValue = organizationInventory.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      const unitCost = product?.cost || 0;
      return sum + (item.total_quantity * unitCost);
    }, 0);

    // Find low stock items based on organization inventory
    const lowStockItems = organizationInventory.items.filter(item => {
      // Consider low stock if current quantity is at or below threshold
      return item.total_quantity <= item.low_stock_threshold && item.low_stock_threshold > 0;
    });

    // Find out of stock items
    const outOfStockItems = organizationInventory.items.filter(item => item.total_quantity === 0);

    // Active products count
    const activeProducts = products.filter(p => p.status === 'active').length;
    
    // Active warehouses count
    const activeWarehouses = warehouses.filter(w => w.status === 'active').length;

    return {
      totalProducts: activeProducts,
      totalStock,
      stockValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      activeWarehouses,
      lowStockItems,
      movementsToday: recentMovements?.filter(m => {
        const moveDate = new Date(m.created_at).toDateString();
        const today = new Date().toDateString();
        return moveDate === today;
      }).length || 0,
    };
  }, [products, organizationInventory, warehouses, recentMovements]);

  // Calculate top movers from movement statistics
  const topMovers = useMemo(() => {
    if (!movementStats?.productMovements || !products) {
      return [];
    }

    const movers = Object.entries(movementStats.productMovements)
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        return {
          product_id: productId,
          product_name: product.name,
          product_sku: product.sku,
          movement_count: data.count,
          total_quantity: data.quantity,
          trend: data.count > 10 ? "up" as const : data.count > 5 ? "stable" as const : "down" as const,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.movement_count || 0) - (a?.movement_count || 0))
      .slice(0, 10);

    return movers as Array<{
      product_id: string;
      product_name: string;
      product_sku: string;
      movement_count: number;
      total_quantity: number;
      trend: "up" | "down" | "stable";
    }>;
  }, [movementStats, products]);

  // Prepare low stock alerts data from organization inventory
  const lowStockAlerts = useMemo(() => {
    if (!stats?.lowStockItems || !products || !warehouses) {
      return [];
    }

    // Transform low stock items to detailed alerts with warehouse info
    const alerts: Array<{
      id: string;
      product_id: string;
      product_name: string;
      product_sku: string;
      warehouse_id: string;
      warehouse_name: string;
      current_quantity: number;
      low_stock_threshold: number;
      total_quantity: number;
    }> = [];
    
    stats.lowStockItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        // Show each warehouse's stock level for the low stock product
        item.warehouses.forEach(warehouse => {
          alerts.push({
            id: `${item.product_id}-${warehouse.warehouse_id}`,
            product_id: item.product_id,
            product_name: product.name,
            product_sku: product.sku,
            warehouse_id: warehouse.warehouse_id,
            warehouse_name: warehouse.warehouse_name,
            current_quantity: warehouse.quantity,
            low_stock_threshold: item.low_stock_threshold,
            total_quantity: item.total_quantity,
          });
        });
      }
    });

    return alerts;
  }, [stats?.lowStockItems, products, warehouses]);

  // Prepare recent movements data
  const recentMovementsData = useMemo(() => {
    if (!recentMovements) return [];
    return recentMovements.slice(0, 10).map(movement => ({
      ...movement,
      created_by: movement.created_by_name || movement.created_by_clerk_user_id || 'Unknown'
    }));
  }, [recentMovements]);

  // Loading state
  const isLoading = productsLoading || warehousesLoading || orgInventoryLoading || movementsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gray-200 rounded-md" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg h-96">
            <div className="animate-pulse p-6">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg h-96">
            <div className="animate-pulse p-6">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <CubeIcon className="mx-auto h-12 w-12 text-blue-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
        <p className="mt-2 text-sm text-gray-500">
          Start by adding products and managing inventory to see dashboard statistics.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Products
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      change: stats.activeWarehouses > 1 ? `Across ${stats.activeWarehouses} warehouses` : null,
      icon: CubeIcon,
      color: "bg-blue-500",
      href: "/dashboard/products",
    },
    {
      name: "Total Stock Units",
      value: stats.totalStock.toLocaleString(),
      change: stats.stockValue > 0 ? `Value: $${stats.stockValue.toLocaleString()}` : null,
      icon: ArchiveBoxIcon,
      color: "bg-green-500",
      href: "/dashboard/inventory?tab=stock-levels",
    },
    {
      name: "Low Stock Alerts",
      value: stats.lowStockCount.toLocaleString(),
      change: stats.outOfStockCount > 0 ? `${stats.outOfStockCount} out of stock` : stats.lowStockCount > 0 ? "Reorder needed" : "All items stocked",
      icon: ExclamationTriangleIcon,
      color: stats.lowStockCount > 0 ? "bg-yellow-500" : "bg-gray-500",
      href: "/dashboard/inventory?tab=stock-levels&filter=low-stock",
    },
    {
      name: "Today's Movements",
      value: stats.movementsToday.toLocaleString(),
      change: recentMovements ? `${recentMovements.length} last 7 days` : null,
      icon: stats.movementsToday > 10 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: "bg-purple-500",
      href: "/dashboard/inventory?tab=movements",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                  {stat.change && (
                    <div className="text-xs text-gray-500 mt-1">
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have <span className="font-medium">{stats.lowStockCount} products</span> with low stock levels.
                {stats.outOfStockCount > 0 && (
                  <span className="ml-1">
                    <span className="font-medium">{stats.outOfStockCount}</span> are completely out of stock.
                  </span>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard/inventory?tab=stock-levels&filter=low-stock"
                    className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600"
                  >
                    Review and restock
                  </Link>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Movements */}
        <div>
          <RecentMovements movements={recentMovementsData} isAdmin={isAdmin} />
        </div>

        {/* Top Movers */}
        <div>
          <TopMovers items={topMovers} period="Last 30 days" />
        </div>
      </div>

      {/* Low Stock Alerts Table */}
      {lowStockAlerts.length > 0 && (
        <LowStockAlerts items={lowStockAlerts} isAdmin={isAdmin} />
      )}

      {/* Movement Type Breakdown */}
      {movementStats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Movement Breakdown</h3>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(movementStats.movementsByType || {}).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500 capitalize">{type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}