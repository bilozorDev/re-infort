"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useProduct } from "@/app/hooks/use-products";

import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { InventoryTab } from "./tabs/InventoryTab";
import { MovementsTab } from "./tabs/MovementsTab";
import { OverviewTab } from "./tabs/OverviewTab";

interface ProductDetailClientProps {
  productId: string;
  isAdmin: boolean;
  organizationId: string;
}

const tabs = [
  { name: "Overview", value: "overview" },
  { name: "Inventory", value: "inventory" },
  { name: "Movements", value: "movements" },
  { name: "Analytics", value: "analytics" },
] as const;

type TabValue = typeof tabs[number]["value"];

export function ProductDetailClient({ productId, isAdmin, organizationId }: ProductDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading product details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load product details. Please try again later.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-sm text-red-600 hover:text-red-500"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and product name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>

      {/* Product title and SKU */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              product.status === "active"
                ? "bg-green-100 text-green-800"
                : product.status === "inactive"
                ? "bg-gray-100 text-gray-800"
                : product.status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {product.status}
          </span>
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
        {activeTab === "overview" && (
          <OverviewTab product={product} isAdmin={isAdmin} organizationId={organizationId} />
        )}
        {activeTab === "inventory" && (
          <InventoryTab productId={productId} isAdmin={isAdmin} />
        )}
        {activeTab === "movements" && (
          <MovementsTab productId={productId} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab productId={productId} />
        )}
      </div>
    </div>
  );
}