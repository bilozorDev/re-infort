"use client";

import { Disclosure } from "@headlessui/react";
import { FunnelIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";

import { type ProductWithCategory } from "@/app/types/product";

import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { ProductFilters } from "./ProductFilters";
import { ProductViewToggle } from "./ProductViewToggle";

export interface FilterState {
  status: string[];
  categories: string[];
  priceRange: { min?: number; max?: number };
  stockLevel: string[];
}

interface ProductToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  table?: Table<ProductWithCategory>;
  availableCategories: { id: string; name: string }[];
}

export function ProductToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  table,
  availableCategories,
}: ProductToolbarProps) {
  // Calculate active filter count
  const activeFilterCount = 
    filters.status.length + 
    filters.categories.length + 
    filters.stockLevel.length +
    (filters.priceRange.min || filters.priceRange.max ? 1 : 0);

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      categories: [],
      priceRange: {},
      stockLevel: [],
    });
  };

  return (
    <Disclosure as="section" aria-labelledby="filter-heading">
      {() => (
        <>
          {/* Main Toolbar */}
          <div className="border-t border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between py-3">
              {/* Left side - Search and Filters */}
              <div className="flex flex-1 items-center gap-x-4">
                {/* Search */}
                <div className="min-w-0 flex-1 max-w-lg">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Search products..."
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center divide-x divide-gray-200">
                  <div className="pr-6">
                    <Disclosure.Button className="group flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                      <FunnelIcon
                        aria-hidden="true"
                        className="mr-2 h-5 w-5 flex-none text-gray-400 group-hover:text-gray-500"
                      />
                      {activeFilterCount > 0 ? (
                        <>
                          {activeFilterCount} Filter{activeFilterCount !== 1 ? 's' : ''}
                        </>
                      ) : (
                        'Filters'
                      )}
                    </Disclosure.Button>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="pl-6">
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - View Controls */}
              <div className="flex items-center gap-x-4">
                {/* View Toggle */}
                <ProductViewToggle
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                />

                {/* Column Visibility (only in list view) */}
                {viewMode === "list" && table && (
                  <ColumnVisibilityMenu table={table} />
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <Disclosure.Panel className="border-b border-gray-200 bg-gray-50">
            <ProductFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableCategories={availableCategories}
            />
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}