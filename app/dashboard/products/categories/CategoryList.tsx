"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { useSubcategories } from "@/app/hooks/use-categories";
import type { Category, Subcategory } from "@/app/types/product";

interface CategoryListProps {
  categories: Category[];
  isAdmin: boolean;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddSubcategory: (categoryId: string) => void;
  onEditSubcategory: (subcategory: Subcategory, categoryId: string) => void;
  onDeleteSubcategory: (subcategory: Subcategory) => void;
}

function CategoryItem({
  category,
  isAdmin,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: {
  category: Category;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubcategory: () => void;
  onEditSubcategory: (subcategory: Subcategory) => void;
  onDeleteSubcategory: (subcategory: Subcategory) => void;
}) {
  const { data: subcategories, isLoading } = useSubcategories(category.id);

  return (
    <Disclosure>
      {({ open }) => (
        <div className="border-b border-gray-200">
          <div className="flex w-full items-center justify-between bg-white px-4 py-4 hover:bg-gray-50">
            <DisclosureButton className="flex flex-1 items-center space-x-3 text-left">
              <ChevronRightIcon
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  open ? "rotate-90" : ""
                }`}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.status}
                  </span>
                </div>
                {category.description && (
                  <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                )}
              </div>
            </DisclosureButton>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onAddSubcategory}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  title="Add subcategory"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={onEdit}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  title="Edit category"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  title="Delete category"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <DisclosurePanel className="bg-gray-50">
            {isLoading ? (
              <div className="px-12 py-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ) : subcategories && subcategories.length > 0 ? (
              <div className="px-12 py-2">
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">{subcategory.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            subcategory.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {subcategory.status}
                        </span>
                      </div>
                      {subcategory.description && (
                        <p className="mt-1 text-xs text-gray-500">{subcategory.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditSubcategory(subcategory)}
                          className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-500"
                          title="Edit subcategory"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSubcategory(subcategory)}
                          className="rounded p-1 text-gray-400 hover:bg-white hover:text-red-500"
                          title="Delete subcategory"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-12 py-4 text-sm text-gray-500">No subcategories</div>
            )}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
}

export default function CategoryList({
  categories,
  isAdmin,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          isAdmin={isAdmin}
          onEdit={() => onEditCategory(category)}
          onDelete={() => onDeleteCategory(category)}
          onAddSubcategory={() => onAddSubcategory(category.id)}
          onEditSubcategory={(subcategory) => onEditSubcategory(subcategory, category.id)}
          onDeleteSubcategory={onDeleteSubcategory}
        />
      ))}
    </div>
  );
}