"use client";

import { PencilIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { useDeleteProduct } from "@/app/hooks/use-products";
import { useSupabase } from "@/app/hooks/use-supabase";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { type ProductWithCategory } from "@/app/types/product";

interface ProductListProps {
  products: ProductWithCategory[];
  viewMode: "list" | "grid";
  onEdit: (id: string) => void;
  isAdmin: boolean;
}

export default function ProductList({
  products,
  viewMode,
  onEdit,
  isAdmin,
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

  return (
    <>
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {productImages[product.id]?.length > 0 ? (
                    <div 
                      className="relative h-10 w-10 cursor-pointer"
                      onClick={() => openLightbox(product.id)}
                    >
                      <img
                        src={productImages[product.id][0]}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover hover:opacity-90 transition-opacity"
                      />
                      {productImages[product.id].length > 1 && (
                        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {productImages[product.id].length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <PhotoIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                    {product.features && product.features.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {product.features.slice(0, 2).map((f) => `${f.name}: ${f.value}`).join(", ")}
                        {product.features.length > 2 && ` +${product.features.length - 2} more`}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.sku}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.category?.name || "-"}
                {product.subcategory && (
                  <span className="block text-xs">{product.subcategory.name}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.cost ? `$${product.cost.toFixed(2)}` : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.price ? `$${product.price.toFixed(2)}` : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                    product.status === "active"
                      ? "bg-green-100 text-green-800"
                      : product.status === "inactive"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(product.id)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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