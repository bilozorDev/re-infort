"use client";

import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { DataError } from "@/app/components/errors/DataError";
import { GridSkeleton } from "@/app/components/skeletons/GridSkeleton";
import { ProductTableSkeleton } from "@/app/components/skeletons/ProductTableSkeleton";
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

function ProductsClientContent({ isAdmin, organizationId }: ProductsClientProps) {
  const { data: products, isLoading, error, refetch } = useProducts();
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
        viewMode === "grid" ? (
          <GridSkeleton items={12} columns={3} />
        ) : (
          <ProductTableSkeleton />
        )
      ) : error ? (
        <DataError
          title="Failed to load products"
          message="We couldn't fetch your product catalog. Please try again."
          error={error as Error}
          onRetry={() => refetch()}
        />
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

// Export the component wrapped with ErrorBoundary
export function ProductsClient(props: ProductsClientProps) {
  return (
    <ErrorBoundary
      level="page"
      resetKeys={[props.organizationId]}
      onError={(error) => {
        console.error("ProductsClient error:", error);
      }}
    >
      <ProductsClientContent {...props} />
    </ErrorBoundary>
  );
}