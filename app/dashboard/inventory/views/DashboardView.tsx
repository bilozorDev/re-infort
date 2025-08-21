"use client";

import { ArrowDownIcon, ArrowUpIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { useOrganizationMovements } from "@/app/hooks/use-stock-movements";
import { useSupabase } from "@/app/hooks/use-supabase";

interface DashboardViewProps {
  isAdmin: boolean;
  organizationId: string;
}

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  recentMovements: number;
}

function DashboardSkeleton() {
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
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-40" />
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardView({ organizationId }: DashboardViewProps) {
  const supabase = useSupabase();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: recentMovements, isLoading: movementsLoading } = useOrganizationMovements({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total products
        const { count: productCount, error: productError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("organization_clerk_id", organizationId)
          .eq("status", "active");

        if (productError) throw productError;

        // Fetch inventory stats
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory")
          .select("quantity, reorder_point");

        if (inventoryError) throw inventoryError;

        const totalStock = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const lowStockItems = inventoryData?.filter(
          item => item.quantity <= (item.reorder_point || 0)
        ).length || 0;

        setStats({
          totalProducts: productCount || 0,
          totalStock,
          lowStockItems,
          recentMovements: recentMovements?.length || 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchStats();
    }
  }, [supabase, organizationId, recentMovements]);

  if (loading || movementsLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
        <p className="mt-2 text-sm text-gray-500">
          Start by adding products and managing inventory to see dashboard statistics.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts,
      icon: "📦",
      color: "bg-blue-500",
    },
    {
      name: "Total Stock",
      value: stats.totalStock.toLocaleString(),
      icon: "📊",
      color: "bg-green-500",
    },
    {
      name: "Low Stock Items",
      value: stats.lowStockItems,
      icon: "⚠️",
      color: stats.lowStockItems > 0 ? "bg-yellow-500" : "bg-gray-500",
    },
    {
      name: "Recent Movements",
      value: stats.recentMovements,
      icon: "🔄",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3 text-white text-xl`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Movements */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Stock Movements</h3>
        </div>
        <div className="px-6 py-4">
          {recentMovements && recentMovements.length > 0 ? (
            <div className="space-y-3">
              {recentMovements.slice(0, 10).map((movement) => (
                <div key={movement.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      movement.quantity > 0 ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {movement.quantity > 0 ? (
                        <ArrowUpIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {movement.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.movement_type} • {movement.from_warehouse_name || movement.to_warehouse_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      movement.quantity > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent stock movements
            </p>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have {stats.lowStockItems} item{stats.lowStockItems !== 1 ? "s" : ""} with low stock levels.
                  Review and reorder soon to avoid stockouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}