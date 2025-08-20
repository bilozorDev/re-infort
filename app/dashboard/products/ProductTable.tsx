"use client";

import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon, PencilIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { useDeleteProduct } from "@/app/hooks/use-products";
import { useSupabase } from "@/app/hooks/use-supabase";
import { useTablePreferences } from "@/app/hooks/use-user-preferences";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { 
  cn,
  debounce,
  formatCurrency, 
  formatDate, 
  getRowDensityStyles,
  getStatusBadgeStyles} from "@/app/lib/utils/table";
import { type ProductWithCategory } from "@/app/types/product";

import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";

interface ProductTableProps {
  products: ProductWithCategory[];
  onEdit: (id: string) => void;
  isAdmin: boolean;
  globalFilter: string;
}

export function ProductTable({ products, onEdit, isAdmin, globalFilter }: ProductTableProps) {
  const supabase = useSupabase();
  const deleteProduct = useDeleteProduct();
  const { preferences, updatePreferences, isLoading: isLoadingPreferences } = useTablePreferences("products", isAdmin);
  
  // Image handling states
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
  const savePreferences = useMemo(
    () => debounce((prefs: {
      columnVisibility: VisibilityState;
      sorting: SortingState;
      columnFilters: ColumnFiltersState;
      density: "compact" | "normal" | "comfortable";
      pageSize: 10 | 25 | 50 | 100;
    }) => {
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
  
  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(id);
    }
  }, [deleteProduct]);
  
  const openLightbox = useCallback((productId: string, index: number = 0) => {
    const images = productImages[productId] || [];
    if (images.length > 0) {
      setLightboxImages(images);
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  }, [productImages]);
  
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
                <img
                  src={images[0]}
                  alt={row.original.name}
                  className="h-10 w-10 rounded-full object-cover hover:opacity-90 transition-opacity"
                />
                {images.length > 1 && (
                  <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {images.length}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
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
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Product
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.name,
        cell: ({ row }) => {
          return (
            <div>
              <div className="font-medium text-gray-900">{row.original.name}</div>
              {row.original.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs">
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
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              SKU
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.sku,
      },
      {
        id: "category",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Category
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.category?.name || "-",
        cell: ({ row }) => {
          return (
            <div>
              <div>{row.original.category?.name || "-"}</div>
              {row.original.subcategory && (
                <div className="text-xs text-gray-500">{row.original.subcategory.name}</div>
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
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cost
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.cost,
        cell: ({ getValue }) => formatCurrency(getValue() as number),
      },
      {
        id: "price",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Price
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.price,
        cell: ({ getValue }) => formatCurrency(getValue() as number),
      },
      {
        id: "status",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={cn(
                "inline-flex px-2 text-xs font-semibold leading-5 rounded-full",
                getStatusBadgeStyles(status)
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
              className="flex items-center gap-1 hover:text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Created
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpDownIcon className="h-3 w-3" />
              )}
            </button>
          );
        },
        accessorFn: (row) => row.created_at,
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(row.original.id)}
                className="text-indigo-600 hover:text-indigo-900"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(row.original.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [productImages, isAdmin, onEdit, handleDelete, openLightbox]
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
  
  const density = preferences?.density || "normal";
  
  return (
    <>
      {/* Table controls */}
      <div className="mb-4 flex justify-end">
        <ColumnVisibilityMenu
          table={table}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      getRowDensityStyles(density)
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-6 whitespace-nowrap text-sm text-gray-900",
                      getRowDensityStyles(density)
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
    </>
  );
}