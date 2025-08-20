"use client";

import { Cog6ToothIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

import { useProducts } from "@/app/hooks/use-products";

import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

interface ProductsClientProps {
  isAdmin: boolean;
  organizationId: string;
}

export function ProductsClient({ isAdmin, organizationId }: ProductsClientProps) {
  const { data: products, isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Note: Filtering is now handled inside ProductTable via globalFilter
  // We pass all products and let TanStack Table handle the filtering

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          {isAdmin && (
            <Link href="/dashboard/products/categories">
              <button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <Cog6ToothIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Manage Categories
              </button>
            </Link>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search products..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "list"
                ? "bg-gray-200 text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "grid"
                ? "bg-gray-200 text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
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
              Loading products...
            </div>
          </div>
        </div>
      ) : (
        <ProductList
          products={products || []}
          viewMode={viewMode}
          onEdit={setEditingProduct}
          isAdmin={isAdmin}
          globalFilter={searchTerm}
          onViewModeChange={setViewMode}
        />
      )}

      {(showForm || editingProduct) && (
        <ProductForm
          productId={editingProduct}
          isOpen={showForm || !!editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          isAdmin={isAdmin}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}