"use client";

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