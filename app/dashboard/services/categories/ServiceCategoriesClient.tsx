"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { PageHeader } from "@/app/components/ui/page-header";
import { useServiceCategories } from "@/app/hooks/use-service-categories";

import ServiceCategoryForm from "./ServiceCategoryForm";
import ServiceCategoryList from "./ServiceCategoryList";

export default function ServiceCategoriesClient() {
  const { data: categories, isLoading } = useServiceCategories();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleEditCategory = (categoryId: string) => {
    setEditingCategory(categoryId);
    setShowCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Categories"
        description="Organize your services into categories for better management"
        backLink={{
          label: "Back to services",
          href: "/dashboard/services",
        }}
        primaryAction={{
          label: "Add Category",
          onClick: () => setShowCategoryForm(true),
          icon: PlusIcon,
        }}
      />

      {/* Categories List */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
            Categories ({categories?.length || 0})
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : categories && categories.length > 0 ? (
            <ServiceCategoryList
              categories={categories}
              onEdit={handleEditCategory}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                No categories yet. Create your first category to organize your services.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <ServiceCategoryForm
          categoryId={editingCategory}
          isOpen={showCategoryForm}
          onClose={handleCloseCategoryForm}
        />
      )}
    </div>
  );
}