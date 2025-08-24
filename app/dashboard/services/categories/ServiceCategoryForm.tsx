"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { Fragment, useEffect } from "react";

import { FormField, TextArea, TextField } from "@/app/components/ui/form";
import { 
  useCreateServiceCategory, 
  useServiceCategory, 
  useUpdateServiceCategory 
} from "@/app/hooks/use-service-categories";

interface ServiceCategoryFormProps {
  categoryId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceCategoryForm({ 
  categoryId, 
  isOpen, 
  onClose 
}: ServiceCategoryFormProps) {
  const { data: category } = useServiceCategory(categoryId || undefined);
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      display_order: 0,
    },
    onSubmit: async ({ value }) => {
      if (categoryId && category) {
        await updateCategory.mutateAsync({
          id: categoryId,
          data: {
            name: value.name,
            description: value.description || null,
            display_order: value.display_order,
          },
        });
      } else {
        await createCategory.mutateAsync({
          name: value.name,
          description: value.description || null,
          display_order: value.display_order,
        });
      }
      onClose();
    },
  });

  // Update form when category data changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        form.reset({
          name: category.name || "",
          description: category.description || "",
          display_order: category.display_order || 0,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          display_order: 0,
        });
      }
    }
  }, [category, isOpen, form]);

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {category ? "Edit Service Category" : "Add New Service Category"}
                    </DialogTitle>

                    <form
                      className="mt-6 space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                      }}
                    >
                      {/* Category Name */}
                      <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) =>
                            !value || value.trim().length === 0 
                              ? "Category name is required" 
                              : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              id="name"
                              label="Category Name"
                              required
                              placeholder="Enter category name"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Description */}
                      <form.Field name="description">
                        {(field) => (
                          <FormField field={field}>
                            <TextArea
                              id="description"
                              label="Description"
                              rows={3}
                              placeholder="Describe this category (optional)"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Display Order */}
                      <form.Field
                        name="display_order"
                        validators={{
                          onChange: ({ value }) => {
                            if (value < 0) {
                              return "Display order must be a positive number";
                            }
                            return undefined;
                          },
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              id="display_order"
                              type="number"
                              label="Display Order"
                              placeholder="0"
                              helperText="Categories with lower numbers appear first"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Form Actions */}
                      <div className="mt-6 flex items-center justify-end gap-x-3">
                        <button
                          type="button"
                          className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
                          onClick={onClose}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting 
                            ? "Saving..." 
                            : category 
                              ? "Update Category" 
                              : "Create Category"
                          }
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}