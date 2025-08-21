"use client";

import { PencilIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { useDeleteProduct } from "@/app/hooks/use-products";
import { useSupabase } from "@/app/hooks/use-supabase";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { type ProductWithCategory } from "@/app/types/product";

import { ProductTable } from "./ProductTable";

interface ProductListProps {
  products: ProductWithCategory[];
  viewMode: "list" | "grid";
  onEdit: (id: string) => void;
  isAdmin: boolean;
  globalFilter?: string;
  onViewModeChange?: (mode: "list" | "grid") => void;
  onTableReady?: (table: unknown) => void;
}

export default function ProductList({
  products,
  viewMode,
  onEdit,
  isAdmin,
  globalFilter = "",
  onTableReady,
}: ProductListProps) {
  const supabase = useSupabase();
  const deleteProduct = useDeleteProduct();
  const [productImages, setProductImages] = useState<Record<string, string[]>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(id);
    }
  };

  const openLightbox = (productId: string, index: number = 0) => {
    const images = productImages[productId] || [];
    if (images.length > 0) {
      setLightboxImages(images);
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  // Use the new TanStack Table for list view
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
          <ProductTable
            products={products}
            onEdit={onEdit}
            isAdmin={isAdmin}
            globalFilter={globalFilter}
            onTableReady={onTableReady}
          />
        </div>
      </div>
    );
  }

  // Keep existing grid view implementation
  if (viewMode === "grid") {
    return (
      <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="relative bg-white rounded-lg shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow"
          >
            {productImages[product.id]?.length > 0 ? (
              <div 
                className="relative w-full h-48 cursor-pointer group"
                onClick={() => openLightbox(product.id)}
              >
                <img
                  src={productImages[product.id][0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-t-lg group-hover:opacity-90 transition-opacity"
                />
                {productImages[product.id].length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    +{productImages[product.id].length - 1} more
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              {product.category && (
                <p className="text-sm text-gray-500 mt-1">{product.category.name}</p>
              )}
              {product.features && product.features.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {feature.name}: {feature.value}
                      </span>
                    ))}
                    {product.features.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{product.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  {product.price && (
                    <p className="text-lg font-semibold text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(product.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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

  // Default fallback (should not reach here)
  return null;
}