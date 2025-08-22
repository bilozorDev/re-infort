"use client";

import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { Tooltip } from "@/app/components/ui/Tooltip";
import { useAllProductsInventory } from "@/app/hooks/use-inventory";
import { useDeleteProduct } from "@/app/hooks/use-products";
import { useSupabase } from "@/app/hooks/use-supabase";
import { useTablePreferences } from "@/app/hooks/use-user-preferences";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { cn, debounce, formatCurrency, formatDate } from "@/app/lib/utils/table";
import { type ProductWithCategory } from "@/app/types/product";

interface ProductTableProps {
  products: ProductWithCategory[];
  onEdit: (id: string) => void;
  isAdmin: boolean;
  globalFilter: string;
  onTableReady?: (table: unknown) => void;
}

export function ProductTable({
  products,
  onEdit,
  isAdmin,
  globalFilter,
  onTableReady,
}: ProductTableProps) {
  const supabase = useSupabase();
  const deleteProduct = useDeleteProduct();
  const {
    preferences,
    updatePreferences,
    isLoading: isLoadingPreferences,
  } = useTablePreferences("products", isAdmin);

  // Fetch inventory data for all products
  const productIds = useMemo(() => products.map((p) => p.id), [products]);
  const { data: inventoryMap } = useAllProductsInventory(productIds);

  // Image handling states - MUST be before any conditional returns
  const [productImages, setProductImages] = useState<Record<string, string[]>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Table states
  const [sorting, setSorting] = useState<SortingState>(preferences?.sorting || []);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    preferences?.columnVisibility || {}
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    preferences?.columnFilters || []
  );

  // Load signed URLs for all products
  useEffect(() => {
    const loadAllImages = async () => {
      const imageMap: Record<string, string[]> = {};

      for (const product of products) {
        if (product.photo_urls && product.photo_urls.length > 0) {
          try {
            const urls = await getSignedUrls(supabase, product.photo_urls);
            imageMap[product.id] = urls;
          } catch (error) {
            console.error(`Failed to load images for product ${product.id}:`, error);
            imageMap[product.id] = [];
          }
        } else {
          imageMap[product.id] = [];
        }
      }

      setProductImages(imageMap);
    };

    if (products.length > 0) {
      loadAllImages();
    }
  }, [products, supabase]);

  // Debounced save preferences
  type PreferencesType = {
    columnVisibility: VisibilityState;
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    density: "compact" | "normal" | "comfortable";
    pageSize: 10 | 25 | 50 | 100;
  };

  const savePreferences = useMemo(
    () =>
      debounce<(prefs: PreferencesType) => void>((prefs: PreferencesType) => {
        updatePreferences(prefs);
      }, 500),
    [updatePreferences]
  );

  // Track if this is the first load to avoid saving on initial mount
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Update preferences when state changes (but not on initial load)
  useEffect(() => {
    if (!isLoadingPreferences && !isInitialLoad) {
      savePreferences({
        columnVisibility,
        sorting,
        columnFilters,
        density: preferences?.density || "normal",
        pageSize: preferences?.pageSize || 25,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, sorting, columnFilters, isInitialLoad, isLoadingPreferences]);

  // Apply preferences when they load (only once)
  useEffect(() => {
    if (preferences && !isLoadingPreferences && isInitialLoad) {
      if (preferences.columnVisibility) {
        setColumnVisibility(preferences.columnVisibility);
      }
      if (preferences.sorting) {
        setSorting(preferences.sorting);
      }
      if (preferences.columnFilters) {
        setColumnFilters(preferences.columnFilters);
      }
      setIsInitialLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences, isLoadingPreferences, isInitialLoad]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this product?")) {
        deleteProduct.mutate(id);
      }
    },
    [deleteProduct]
  );

  const openLightbox = useCallback(
    (productId: string, index: number = 0) => {
      const images = productImages[productId] || [];
      if (images.length > 0) {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
      }
    },
    [productImages]
  );

  // Column definitions
  const columns = useMemo<ColumnDef<ProductWithCategory>[]>(
    () => [
      {
        id: "photo",
        header: "Photo",
        accessorFn: (row) => row.photo_urls?.length || 0,
        cell: ({ row }) => {
          const images = productImages[row.original.id] || [];
          if (images.length > 0) {
            return (
              <div
                className="relative h-10 w-10 cursor-pointer"
                onClick={() => openLightbox(row.original.id)}
              >
                <Image
                  src={images[0]}
                  alt={row.original.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-cover hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all"
                />
                {images.length > 1 && (
                  <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {images.length}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <PhotoIcon className="h-5 w-5 text-gray-400" />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "name",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Product
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.name,
        cell: ({ row }) => {
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
              {row.original.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                  {row.original.description}
                </div>
              )}
            </div>
          );
        },
        enableHiding: false,
      },
      {
        id: "sku",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              SKU
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.sku,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-500">{getValue() as string}</span>
        ),
      },
      {
        id: "category",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Category
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.category?.name || "-",
        cell: ({ row }) => {
          return (
            <div>
              <div className="text-sm text-gray-900">{row.original.category?.name || "-"}</div>
              {row.original.subcategory && (
                <div className="text-xs text-gray-500 mt-0.5">{row.original.subcategory.name}</div>
              )}
            </div>
          );
        },
      },
      {
        id: "cost",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cost
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.cost,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900 font-medium">
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
      {
        id: "price",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Price
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.price,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900 font-medium">
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
      {
        id: "quantity",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Quantity
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => {
          const inventory = inventoryMap?.get(row.id);
          return inventory?.total_quantity || 0;
        },
        cell: ({ row }) => {
          const inventory = inventoryMap?.get(row.original.id);
          if (!inventory) {
            return <span className="text-sm text-gray-500">-</span>;
          }
          const total = inventory.total_quantity || 0;
          const reserved = inventory.total_reserved || 0;

          return (
            <div className="text-sm font-medium text-gray-900">
              {total}
              {reserved > 0 && (
                <Tooltip content="Reserved">
                  <span className="text-amber-600 ml-0.5 cursor-help">({reserved})</span>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                status === "active" && "bg-green-100 text-green-800",
                status === "inactive" && "bg-gray-100 text-gray-800",
                status === "draft" && "bg-yellow-100 text-yellow-800",
                status === "archived" && "bg-red-100 text-red-800"
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "created_at",
        header: ({ column }) => {
          return (
            <button
              className="group inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Created
              <span className="ml-1 flex-none text-gray-400 group-hover:text-gray-500">
                {column.getIsSorted() === "asc" ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpDownIcon className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        },
        accessorFn: (row) => row.created_at,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-500">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/dashboard/products/${row.original.id}`}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="View details"
              >
                <EyeIcon className="h-5 w-5" />
                <span className="sr-only">View {row.original.name}</span>
              </Link>
              <button
                onClick={() => onEdit(row.original.id)}
                className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
              >
                Edit<span className="sr-only">, {row.original.name}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(row.original.id)}
                  className="text-red-600 hover:text-red-900 font-medium text-sm"
                >
                  Delete<span className="sr-only">, {row.original.name}</span>
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [productImages, isAdmin, onEdit, handleDelete, openLightbox, inventoryMap]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableMultiSort: true,
  });

  // Pass the table instance to parent component
  useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // Show loading state while preferences are loading - MUST be after all hooks
  if (isLoadingPreferences) {
    return (
      <div className="mt-4 flow-root">
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
              Loading view preferences...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary level="section" resetKeys={[products.length]}>
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="relative min-w-full divide-y divide-gray-300">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => (
                      <th
                        key={header.id}
                        scope="col"
                        className={cn(
                          index === 0 ? "py-3.5 pr-3 pl-4 sm:pl-3" : "px-3 py-3.5",
                          "text-left text-sm font-semibold text-gray-900",
                          header.id === "actions" && "py-3.5 pr-4 pl-3 sm:pr-3"
                        )}
                      >
                        {header.id === "actions" ? (
                          <span className="sr-only">Actions</span>
                        ) : header.isPlaceholder ? null : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white">
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={cn(
                      rowIndex % 2 === 1 && "bg-gray-50",
                      "hover:bg-gray-100 transition-colors"
                    )}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        className={cn(
                          cellIndex === 0 ? "py-4 pr-3 pl-4 sm:pl-3" : "px-3 py-4",
                          "text-sm whitespace-nowrap",
                          cellIndex === 0 ? "font-medium text-gray-900" : "text-gray-500",
                          cell.column.id === "actions" && "py-4 pr-4 pl-3 text-right sm:pr-3"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {table.getRowModel().rows.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </ErrorBoundary>
  );
}
