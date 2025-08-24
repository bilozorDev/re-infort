"use client";

import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteServiceCategory } from "@/app/hooks/use-service-categories";
import { type Tables } from "@/app/types/database.types";

type ServiceCategory = Tables<"service_categories">;

interface ServiceCategoryListProps {
  categories: ServiceCategory[];
  onEdit: (categoryId: string) => void;
}

export default function ServiceCategoryList({ 
  categories, 
  onEdit 
}: ServiceCategoryListProps) {
  const deleteCategory = useDeleteServiceCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (category: ServiceCategory) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(category.id);
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      if (error && typeof error === 'object' && 'hasDependencies' in error) {
        toast.error((error as { message: string }).message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
        >
          <div className="flex-1">
            <div className="flex items-center gap-x-3">
              <h4 className="text-sm font-medium text-gray-900">
                {category.name}
              </h4>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  category.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {category.status}
              </span>
            </div>
            {category.description && (
              <p className="mt-1 text-sm text-gray-500">
                {category.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-x-2">
            <button
              onClick={() => onEdit(category.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              title="Edit category"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              disabled={deletingId === category.id}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              title="Delete category"
            >
              {deletingId === category.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}