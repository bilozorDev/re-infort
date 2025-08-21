"use client";

import { type FilterState } from "./ProductToolbar";

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: { id: string; name: string }[];
}

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

const stockLevelOptions = [
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock (< 10)" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const priceRangeOptions = [
  { value: "0-25", label: "$0 - $25", min: 0, max: 25 },
  { value: "25-50", label: "$25 - $50", min: 25, max: 50 },
  { value: "50-100", label: "$50 - $100", min: 50, max: 100 },
  { value: "100+", label: "$100+", min: 100, max: undefined },
];

export function ProductFilters({
  filters,
  onFiltersChange,
  availableCategories,
}: ProductFiltersProps) {
  const handleStatusChange = (value: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, value]
      : filters.status.filter((s) => s !== value);
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, value]
      : filters.categories.filter((c) => c !== value);
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleStockLevelChange = (value: string, checked: boolean) => {
    const newStockLevel = checked
      ? [...filters.stockLevel, value]
      : filters.stockLevel.filter((s) => s !== value);
    onFiltersChange({ ...filters, stockLevel: newStockLevel });
  };

  const handlePriceRangeChange = (min?: number, max?: number, checked?: boolean) => {
    if (checked === false) {
      onFiltersChange({ ...filters, priceRange: {} });
    } else {
      onFiltersChange({ ...filters, priceRange: { min, max } });
    }
  };

  const isPriceRangeSelected = (min?: number, max?: number) => {
    return filters.priceRange.min === min && filters.priceRange.max === max;
  };

  return (
    <div className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {/* Status Filter */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-900">Status</legend>
            <div className="space-y-3 pt-6">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`status-${option.value}`}
                    name="status[]"
                    value={option.value}
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`status-${option.value}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Category Filter */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-900">Category</legend>
            <div className="space-y-3 pt-6 max-h-48 overflow-y-auto">
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    id={`category-${category.id}`}
                    name="category[]"
                    value={category.id}
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
              {availableCategories.length === 0 && (
                <p className="text-sm text-gray-500">No categories available</p>
              )}
            </div>
          </fieldset>

          {/* Price Range Filter */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-900">Price Range</legend>
            <div className="space-y-3 pt-6">
              {priceRangeOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`price-${option.value}`}
                    name="price"
                    type="radio"
                    checked={isPriceRangeSelected(option.min, option.max)}
                    onChange={(e) => handlePriceRangeChange(option.min, option.max, e.target.checked)}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`price-${option.value}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
              {(filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) && (
                <button
                  onClick={() => handlePriceRangeChange(undefined, undefined, false)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear price filter
                </button>
              )}
            </div>
          </fieldset>

          {/* Stock Level Filter */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-900">Stock Level</legend>
            <div className="space-y-3 pt-6">
              {stockLevelOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`stock-${option.value}`}
                    name="stock[]"
                    value={option.value}
                    type="checkbox"
                    checked={filters.stockLevel.includes(option.value)}
                    onChange={(e) => handleStockLevelChange(option.value, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`stock-${option.value}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}