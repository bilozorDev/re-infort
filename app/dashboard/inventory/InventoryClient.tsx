"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";

import { DashboardView } from "./views/DashboardView";
import { MovementsView } from "./views/MovementsView";
import { ReportsView } from "./views/ReportsView";
import { StockLevelsView } from "./views/StockLevelsView";

interface InventoryClientProps {
  isAdmin: boolean;
  organizationId: string;
}

const tabs = [
  { name: "Dashboard", value: "dashboard" },
  { name: "Stock Levels", value: "stock-levels" },
  { name: "Movements", value: "movements" },
  { name: "Reports", value: "reports" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

export function InventoryClient({ isAdmin, organizationId }: InventoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabValue) || "dashboard";

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());

      if (tab === "dashboard") {
        // Remove tab param for default view to keep URL clean
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }

      const query = params.toString();
      const url = query ? `?${query}` : window.location.pathname;
      router.push(url, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage inventory across all warehouses
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.value
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <ErrorBoundary level="section" resetKeys={[activeTab]}>
          {activeTab === "dashboard" && (
            <DashboardView isAdmin={isAdmin} organizationId={organizationId} />
          )}
          {activeTab === "stock-levels" && (
            <StockLevelsView isAdmin={isAdmin} organizationId={organizationId} />
          )}
          {activeTab === "movements" && <MovementsView isAdmin={isAdmin} />}
          {activeTab === "reports" && <ReportsView organizationId={organizationId} />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
