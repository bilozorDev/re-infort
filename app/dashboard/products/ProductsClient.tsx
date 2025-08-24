"use client";

import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { PageHeader } from "@/app/components/ui/page-header";
import { useAllCategories } from "@/app/hooks/use-categories";
import { useProducts } from "@/app/hooks/use-products";
import { type ProductWithCategory } from "@/app/types/product";

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
  const [tableInstance, setTableInstance] = useState<Table<ProductWithCategory> | undefined>(undefined);
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
    // TODO: Implement stock level filtering using inventory data
    if (filters.stockLevel.length > 0) {
      // Stock level filtering needs to be implemented with inventory data
      // For now, don't filter by stock level as product.quantity doesn't exist
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
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory"
        primaryAction={{
          label: "Add Product",
          onClick: () => setShowForm(true),
          icon: PlusIcon,
        }}
        secondaryActions={isAdmin ? [
          {
            label: "Manage Categories",
            href: "/dashboard/products/categories",
            icon: Cog6ToothIcon,
          },
        ] : []}
      />

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
          onTableReady={(table) => setTableInstance(table as Table<ProductWithCategory>)}
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