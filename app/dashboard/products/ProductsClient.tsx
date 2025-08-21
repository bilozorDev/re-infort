"use client";

import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAllCategories } from "@/app/hooks/use-categories";
import { useProducts } from "@/app/hooks/use-products";

import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import { type FilterState, ProductToolbar } from "./ProductToolbar";

interface ProductsClientProps {
  isAdmin: boolean;
  organizationId: string;
}

export function ProductsClient({ isAdmin, organizationId }: ProductsClientProps) {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useAllCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [tableInstance, setTableInstance] = useState<unknown>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    categories: [],
    priceRange: {},
    stockLevel: [],
  });

  // Filter products based on active filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status.includes(p.status || "active"));
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => p.category_id && filters.categories.includes(p.category_id));
    }

    // Apply price range filter
    if (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) {
      filtered = filtered.filter((p) => {
        const price = p.price || 0;
        const min = filters.priceRange.min ?? 0;
        const max = filters.priceRange.max ?? Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply stock level filter
    if (filters.stockLevel.length > 0) {
      filtered = filtered.filter((p) => {
        const quantity = p.quantity || 0;
        if (filters.stockLevel.includes("in_stock") && quantity > 10) return true;
        if (filters.stockLevel.includes("low_stock") && quantity > 0 && quantity <= 10) return true;
        if (filters.stockLevel.includes("out_of_stock") && quantity === 0) return true;
        return false;
      });
    }

    return filtered;
  }, [products, filters]);

  // Prepare categories for filter
  const availableCategories = useMemo(() => {
    if (!categories) return [];
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
    }));
  }, [categories]);

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

      {/* Product Toolbar with Filters and View Controls */}
      <ProductToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={setFilters}
        availableCategories={availableCategories}
        table={tableInstance}
      />

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
          products={filteredProducts}
          viewMode={viewMode}
          onEdit={setEditingProduct}
          isAdmin={isAdmin}
          globalFilter={searchTerm}
          onViewModeChange={setViewMode}
          onTableReady={setTableInstance}
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