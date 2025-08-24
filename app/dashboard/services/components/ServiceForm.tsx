"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { Fragment, useEffect, useState } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useCreateServiceCategory, useServiceCategories } from "@/app/hooks/use-service-categories";
import { type Tables } from "@/app/types/database.types";

type Service = Tables<"services">;

interface ServiceFormProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Service>) => void;
  isSubmitting: boolean;
  isAdmin: boolean;
}

export default function ServiceForm({
  service,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isAdmin,
}: ServiceFormProps) {
  const { data: categories, isLoading: categoriesLoading } = useServiceCategories(true);
  const createCategory = useCreateServiceCategory();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const form = useForm({
    defaultValues: service ? {
      name: service.name || "",
      description: service.description || "",
      service_category_id: service.service_category_id || "",
      rate_type: service.rate_type || "fixed" as const,
      rate: service.rate,
      unit: service.unit || "",
      status: service.status || "active" as const,
    } : {
      name: "",
      description: "",
      service_category_id: "",
      rate_type: "fixed" as const,
      rate: null as number | null,
      unit: "",
      status: "active" as const,
    },
    onSubmit: async ({ value }) => {
      // Convert empty rate to null
      const finalData = {
        ...value,
        rate: value.rate === 0 ? null : value.rate,
        service_category_id: value.service_category_id || null,
      };
      
      onSubmit(finalData);
    },
  });

  // Reset auxiliary states when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen]);

  const handleClose = () => {
    form.reset();
    setShowNewCategory(false);
    setNewCategoryName("");
    onClose();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const result = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        status: "active",
      });
      
      // Set the new category as selected
      form.setFieldValue("service_category_id", result.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  // Rate type options
  const rateTypeOptions = [
    { value: "fixed", label: "Fixed Price" },
    { value: "hourly", label: "Hourly Rate" },
    { value: "custom", label: "Custom" },
  ];

  // Status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Category select options
  const categoryOptions = [
    { value: "", label: "No category" },
    ...(categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || []),
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {service ? "Edit Service" : "Add New Service"}
                    </DialogTitle>
                    
                    <form
                      className="mt-6 space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                      }}
                    >
                      {/* Service Name */}
                      <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) =>
                            !value || value.trim().length === 0 ? "Service name is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              id="name"
                              label="Service Name"
                              required
                              placeholder="Enter service name"
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
                              placeholder="Describe the service"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Category Field */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm/6 font-medium text-gray-900">
                            Category
                          </label>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setShowNewCategory(!showNewCategory)}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                            >
                              {showNewCategory ? (
                                <>Cancel</>  
                              ) : (
                                <><PlusIcon className="h-4 w-4" /> New Category</>
                              )}
                            </button>
                          )}
                        </div>
                        
                        {showNewCategory ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateCategory();
                                }
                                if (e.key === "Escape") {
                                  setShowNewCategory(false);
                                  setNewCategoryName("");
                                }
                              }}
                              placeholder="Enter category name"
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                              autoFocus
                            />
                            <p className="text-xs text-gray-500">Press Enter to save or Escape to cancel</p>
                          </div>
                        ) : (
                          <form.Field name="service_category_id">
                            {(field) => (
                              <FormField field={field}>
                                {categoriesLoading ? (
                                  <div className="flex items-center space-x-2 py-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                    <span className="text-sm text-gray-500">Loading categories...</span>
                                  </div>
                                ) : (
                                  <Select
                                    id="service_category_id"
                                    options={categoryOptions}
                                    placeholder="Select a category"
                                  />
                                )}
                              </FormField>
                            )}
                          </form.Field>
                        )}
                      </div>

                      {/* Rate Type and Rate */}
                      <div className="grid grid-cols-2 gap-4">
                        <form.Field name="rate_type">
                          {(field) => (
                            <FormField field={field}>
                              <Select
                                id="rate_type"
                                label="Rate Type"
                                options={rateTypeOptions}
                              />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field
                          name="rate"
                          validators={{
                            onChange: ({ value }) =>
                              value !== null && value !== undefined && value < 0
                                ? "Rate must be a positive number"
                                : undefined,
                          }}
                        >
                          {(field) => (
                            <form.Subscribe
                              selector={(state) => state.values.rate_type}
                            >
                              {(rateType) => (
                                <FormField field={field}>
                                  <TextField
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    label="Rate"
                                    prefix="$"
                                    placeholder={
                                      rateType === "custom" ? "Custom pricing" : "0.00"
                                    }
                                  />
                                </FormField>
                              )}
                            </form.Subscribe>
                          )}
                        </form.Field>
                      </div>

                      {/* Unit - Only show for custom rate type */}
                      <form.Subscribe
                        selector={(state) => state.values.rate_type}
                      >
                        {(rateType) => {
                          if (rateType !== "custom") {
                            return null;
                          }

                          return (
                            <form.Field name="unit">
                              {(field) => (
                                <FormField field={field}>
                                  <TextField
                                    id="unit"
                                    label="Unit (optional)"
                                    placeholder="e.g., per project, per day, per sqft"
                                    helperText="Describe the unit of measurement for custom pricing"
                                  />
                                </FormField>
                              )}
                            </form.Field>
                          );
                        }}
                      </form.Subscribe>

                      {/* Status */}
                      <form.Field name="status">
                        {(field) => (
                          <FormField field={field}>
                            <Select
                              id="status"
                              label="Status"
                              options={statusOptions}
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Form Actions */}
                      <div className="mt-6 flex items-center justify-end gap-x-3">
                        <button
                          type="button"
                          className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
                          onClick={handleClose}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Saving..." : service ? "Update Service" : "Create Service"}
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