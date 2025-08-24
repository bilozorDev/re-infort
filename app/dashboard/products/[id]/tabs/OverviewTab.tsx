"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";

import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { useProductInventory } from "@/app/hooks/use-inventory";
import { useSupabase } from "@/app/hooks/use-supabase";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { formatCurrency, formatDate } from "@/app/lib/utils/table";
import { type ProductWithCategory } from "@/app/types/product";

import { RecentActivityFeed } from "../components/RecentActivityFeed";
import { StockSummaryCard } from "../components/StockSummaryCard";

interface OverviewTabProps {
  product: ProductWithCategory;
  isAdmin: boolean;
  organizationId: string;
}

export function OverviewTab({ product, isAdmin }: OverviewTabProps) {
  const supabase = useSupabase();
  const { data: inventory, isLoading: inventoryLoading } = useProductInventory(product.id);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lowStockEnabled, setLowStockEnabled] = useState(product.low_stock_threshold > 0);
  const [threshold, setThreshold] = useState(product.low_stock_threshold || 10);
  const [thresholdInput, setThresholdInput] = useState((product.low_stock_threshold || 10).toString());
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const queryClient = useQueryClient();

  const updateThresholdMutation = useMutation({
    mutationFn: async (newThreshold: number) => {
      const response = await fetch(`/api/products/${product.id}/low-stock-threshold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ low_stock_threshold: newThreshold }),
      });
      if (!response.ok) throw new Error("Failed to update threshold");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      queryClient.invalidateQueries({ queryKey: ["product-inventory", product.id] });
      setIsEditingThreshold(false);
    },
  });

  const handleToggleLowStock = (enabled: boolean) => {
    setLowStockEnabled(enabled);
    const newThreshold = enabled ? threshold : 0;
    updateThresholdMutation.mutate(newThreshold);
  };

  const handleUpdateThreshold = () => {
    const value = parseInt(thresholdInput) || 0;
    if (value > 0) {
      setThreshold(value);
      updateThresholdMutation.mutate(value);
    }
  };

  const handleStartEdit = () => {
    setThresholdInput(threshold.toString());
    setIsEditingThreshold(true);
  };

  const handleCancelEdit = () => {
    setThresholdInput(threshold.toString());
    setIsEditingThreshold(false);
  };

  // Load product images
  useEffect(() => {
    const loadImages = async () => {
      if (product.photo_urls && product.photo_urls.length > 0) {
        try {
          const urls = await getSignedUrls(supabase, product.photo_urls);
          setProductImages(urls);
        } catch (error) {
          console.error("Failed to load product images:", error);
        }
      }
    };
    loadImages();
  }, [product.photo_urls, supabase]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Product Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Information Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {product.category?.name || "-"}
                  {product.subcategory && (
                    <span className="text-gray-500"> / {product.subcategory.name}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Cost</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">
                  {formatCurrency(product.cost)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">
                  {formatCurrency(product.price)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.serial_number || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{product.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(product.created_at)}</dd>
              </div>
            </dl>
            
            {/* Low Stock Alert Toggle */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex grow flex-col">
                    <label className="text-sm font-medium text-gray-900">
                      Low Stock Alert
                    </label>
                    <span className="text-sm text-gray-500">
                      Get notified when total stock falls below threshold
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {lowStockEnabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Alert at:</span>
                        {isEditingThreshold ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={thresholdInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string and numbers only
                                if (value === '' || /^\d+$/.test(value)) {
                                  setThresholdInput(value);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateThreshold();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Units"
                              autoFocus
                            />
                            <button
                              onClick={handleUpdateThreshold}
                              className="text-green-600 hover:text-green-700 p-1"
                              disabled={updateThresholdMutation.isPending || !thresholdInput || parseInt(thresholdInput) <= 0}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-700 p-1"
                              disabled={updateThresholdMutation.isPending}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartEdit}
                            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            {threshold} units
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleLowStock(!lowStockEnabled)}
                      className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        lowStockEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      disabled={updateThresholdMutation.isPending}
                    >
                      <span className="sr-only">Enable low stock alert</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          lowStockEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {/* Low Stock Warning if applicable */}
                {lowStockEnabled && inventory && inventory.total_quantity <= threshold && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="ml-3 text-sm text-yellow-800">
                        Low stock alert: Current stock ({inventory.total_quantity} units) is below threshold ({threshold} units)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {product.description && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Product Images */}
        {productImages.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-75 transition-opacity"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Features */}
        {product.features && product.features.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Product Features</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-3">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">
                      {feature.name}
                    </dt>
                    <dd className="text-sm text-gray-900">{feature.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Stock Summary and Activity */}
      <div className="space-y-6">
        {/* Stock Summary */}
        <StockSummaryCard 
          productId={product.id} 
          inventory={inventory}
          isLoading={inventoryLoading}
          isAdmin={isAdmin}
        />

        {/* Recent Activity */}
        <RecentActivityFeed productId={product.id} />
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          images={productImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </div>
  );
}