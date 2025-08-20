"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useCategories, useCreateSubcategory, useUpdateSubcategory } from "@/app/hooks/use-categories";
import { createSubcategorySchema } from "@/app/lib/validations/product";
import type { Subcategory } from "@/app/types/product";

interface SubcategoryFormProps {
  subcategory: Subcategory | null;
  categoryId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubcategoryForm({ 
  subcategory, 
  categoryId, 
  isOpen, 
  onClose 
}: SubcategoryFormProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();

  const form = useForm({
    defaultValues: {
      category_id: categoryId || "",
      name: "",
      description: "",
      status: "active" as "active" | "inactive",
      display_order: "0",
    },
    onSubmit: async ({ value }) => {
      try {
        const data = {
          category_id: value.category_id,
          name: value.name,
          description: value.description || null,
          status: value.status,
          display_order: parseInt(value.display_order) || 0,
        };

        if (subcategory) {
          // For update, category_id is optional
          const updateData = {
            name: data.name,
            description: data.description,
            status: data.status,
            display_order: data.display_order,
          };
          await updateSubcategory.mutateAsync({ id: subcategory.id, data: updateData });
        } else {
          const validatedData = createSubcategorySchema.parse(data);
          await createSubcategory.mutateAsync(validatedData);
        }
        onClose();
      } catch {
        // Error is handled by mutation hooks and toast notifications
      }
    },
  });

  // Update form when subcategory data changes
  useEffect(() => {
    if (subcategory) {
      form.reset({
        category_id: subcategory.category_id || categoryId || "",
        name: subcategory.name || "",
        description: subcategory.description || "",
        status: subcategory.status as "active" | "inactive",
        display_order: subcategory.display_order?.toString() || "0",
      });
    } else {
      form.reset({
        category_id: categoryId || "",
        name: "",
        description: "",
        status: "active",
        display_order: "0",
      });
    }
  }, [subcategory, categoryId, form]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const categoryOptions = categories?.map((cat) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  const isSubmitting = createSubcategory.isPending || updateSubcategory.isPending;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {subcategory ? "Edit Subcategory" : "Add New Subcategory"}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-6"
              >
                {!subcategory && (
                  <form.Field
                    name="category_id"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Category is required" : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field}>
                        <Select
                          label="Category"
                          options={categoryOptions}
                          placeholder={categoriesLoading && categoryId ? "Loading..." : "Select a category"}
                          required
                          disabled={!!categoryId}
                        />
                      </FormField>
                    )}
                  </form.Field>
                )}

                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Subcategory name is required" : undefined,
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <TextField
                        label="Subcategory Name"
                        placeholder="Enter subcategory name"
                        required
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <FormField field={field}>
                      <TextArea
                        label="Description"
                        rows={3}
                        placeholder="Enter subcategory description (optional)"
                      />
                    </FormField>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <form.Field name="status">
                    {(field) => (
                      <FormField field={field}>
                        <Select label="Status" options={statusOptions} required />
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field
                    name="display_order"
                    validators={{
                      onChange: ({ value }) => {
                        const num = parseInt(value);
                        if (value && (isNaN(num) || num < 0)) {
                          return "Display order must be a positive number";
                        }
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Display Order"
                          type="number"
                          placeholder="0"
                          min="0"
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Cancel
                  </button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit]) => (
                      <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? "Saving..."
                          : subcategory
                          ? "Update Subcategory"
                          : "Create Subcategory"}
                      </button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}