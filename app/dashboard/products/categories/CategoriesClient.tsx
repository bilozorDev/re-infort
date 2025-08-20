"use client";

import { ArrowLeftIcon, CubeIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  useAllCategories,
  useDeleteCategory,
  useDeleteSubcategory,
} from "@/app/hooks/use-categories";
import type { Category, Subcategory } from "@/app/types/product";

import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import SubcategoryForm from "./SubcategoryForm";

interface CategoriesClientProps {
  isAdmin: boolean;
}

export function CategoriesClient({ isAdmin }: CategoriesClientProps) {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useAllCategories();
  const deleteCategory = useDeleteCategory();
  const deleteSubcategory = useDeleteSubcategory();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "subcategory";
    item: Category | Subcategory;
    subcategoryCount?: number;
    productCount?: number;
  } | null>(null);

  const filteredCategories = categories?.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      const err = error as { hasDependencies?: boolean; subcategory_count?: number; product_count?: number };
      if (err.hasDependencies) {
        setDeleteConfirm({
          type: "category",
          item: category,
          subcategoryCount: err.subcategory_count,
          productCount: err.product_count,
        });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      // Force delete by calling the API directly
      const endpoint = deleteConfirm.type === "category" 
        ? `/api/categories/${deleteConfirm.item.id}?force=true`
        : `/api/subcategories/${deleteConfirm.item.id}?force=true`;
      
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(
          deleteConfirm.type === "category"
            ? "Category deleted successfully"
            : "Subcategory deleted successfully"
        );
        // Refresh the data using React Query
        await queryClient.invalidateQueries({ queryKey: ["categories"] });
        await queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    setSubcategoryCategoryId(categoryId);
    setEditingSubcategory(null);
    setShowSubcategoryForm(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory, categoryId: string) => {
    setEditingSubcategory(subcategory);
    setSubcategoryCategoryId(categoryId);
    setShowSubcategoryForm(true);
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    try {
      await deleteSubcategory.mutateAsync(subcategory.id);
    } catch (error) {
      const err = error as { hasDependencies?: boolean; product_count?: number };
      if (err.hasDependencies) {
        setDeleteConfirm({
          type: "subcategory",
          item: subcategory,
          productCount: err.product_count,
        });
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="mb-4 absolute -top-6 -left-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to products
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product categories and subcategories
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-x-3">
            <Link
              href="/dashboard/products/library"
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <CubeIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              Import from Library
            </Link>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Add Category
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search categories..."
            />
          </div>
        </div>
      </div>

      {isLoading ? (
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
              Loading categories...
            </div>
          </div>
        </div>
      ) : (
        <CategoryList
          categories={filteredCategories || []}
          isAdmin={isAdmin}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddSubcategory={handleAddSubcategory}
          onEditSubcategory={handleEditSubcategory}
          onDeleteSubcategory={handleDeleteSubcategory}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {showSubcategoryForm && (
        <SubcategoryForm
          subcategory={editingSubcategory}
          categoryId={subcategoryCategoryId}
          isOpen={showSubcategoryForm}
          onClose={() => {
            setShowSubcategoryForm(false);
            setEditingSubcategory(null);
            setSubcategoryCategoryId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteConfirm.type === "category" ? "Category" : "Subcategory"}`}
          message={`Are you sure you want to delete "${deleteConfirm.item.name}"? This action cannot be undone.`}
          subcategoryCount={deleteConfirm.subcategoryCount}
          productCount={deleteConfirm.productCount}
        />
      )}
    </div>
  );
}