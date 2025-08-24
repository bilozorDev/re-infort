"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useInventoryAnalytics } from "@/app/hooks/use-inventory";
import { formatCurrency } from "@/app/lib/utils/table";

interface AnalyticsTabProps {
  productId: string;
}

export function AnalyticsTab({ productId }: AnalyticsTabProps) {
  const [period, setPeriod] = useState("30d");
  const { data: analytics, isLoading } = useInventoryAnalytics(productId, period);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Analytics Period</h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Movement"
          value={analytics?.totalMovement || 0}
          format="number"
        />
        <MetricCard
          title="Avg. Daily Movement"
          value={analytics?.avgDailyMovement || 0}
          format="number"
        />
        <MetricCard
          title="Stock Value"
          value={analytics?.stockValue || 0}
          format="currency"
        />
        <MetricCard
          title="Turnover Rate"
          value={analytics?.turnoverRate || 0}
          suffix="/month"
          format="decimal"
        />
      </div>

      {/* Movement Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Movement Breakdown</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            {analytics?.movementBreakdown && Object.entries(analytics.movementBreakdown as Record<string, { count: number; quantity: number }>).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getColorForMovementType(type)}`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{data.count} movements</span>
                  <span className="text-sm font-semibold text-gray-900">{data.quantity} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Warehouses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Warehouses by Activity</h3>
          </div>
          <div className="px-6 py-4">
            {analytics?.topWarehouses && analytics.topWarehouses.length > 0 ? (
              <div className="space-y-3">
                {(analytics.topWarehouses as Array<{ id: string; name: string; movements: number }>).map((warehouse, index) => (
                  <div key={warehouse.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm text-gray-900">{warehouse.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {warehouse.movements} movements
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No warehouse activity in this period</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Stock Levels Trend</h3>
          </div>
          <div className="px-6 py-4">
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p className="text-sm">Stock level chart will be implemented here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  format = "number", 
  suffix = "" 
}: { 
  title: string; 
  value: number; 
  change?: number; 
  format?: "number" | "currency" | "decimal"; 
  suffix?: string;
}) {
  const formatValue = () => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "decimal":
        return value.toFixed(2);
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className="mt-2">
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {formatValue()}{suffix}
          </p>
          {change !== undefined && (
            <p className={`ml-2 flex items-baseline text-sm font-semibold ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {change >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
              )}
              <span className="sr-only">{change >= 0 ? "Increased" : "Decreased"} by</span>
              {Math.abs(change)}%
            </p>
          )}
        </div>
      </dd>
    </div>
  );
}

function getColorForMovementType(type: string): string {
  const colors: Record<string, string> = {
    receipt: "bg-green-500",
    sale: "bg-red-500",
    transfer: "bg-blue-500",
    adjustment: "bg-gray-500",
    return: "bg-yellow-500",
    damage: "bg-orange-500",
    production: "bg-purple-500",
  };
  return colors[type] || "bg-gray-500";
}