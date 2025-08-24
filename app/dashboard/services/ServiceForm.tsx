"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import toast from "react-hot-toast";

import type { SelectOption } from "@/app/components/ui/form";
import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import type { Service, ServiceInsert, ServiceUpdate } from "@/app/types/quotes-helpers";

interface ServiceFormProps {
  service?: Service;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceInsert | ServiceUpdate) => Promise<void>;
}

export default function ServiceForm({ service, isOpen, onClose, onSubmit }: ServiceFormProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      rate_type: "fixed" as "hourly" | "fixed" | "custom",
      rate: "",
      unit: "",
      status: "active" as "active" | "inactive",
    },
    onSubmit: async ({ value }) => {
      try {
        // Basic validation
        if (!value.name.trim()) {
          toast.error("Service name is required");
          return;
        }

        const data = {
          ...value,
          rate: value.rate ? parseFloat(value.rate) : null,
        };

        await onSubmit(data);
        onClose();
      } catch (error) {
        console.error("Form submission error:", error);
        // Error is handled by parent component
      }
    },
  });

  // Update form when service data changes or modal opens
  useEffect(() => {
    if (service && isOpen) {
      form.reset({
        name: service.name || "",
        description: service.description || "",
        category: service.category || "",
        rate_type: service.rate_type || "fixed",
        rate: service.rate?.toString() || "",
        unit: service.unit || "",
        status: service.status || "active",
      });
    } else if (!service && isOpen) {
      form.reset({
        name: "",
        description: "",
        category: "",
        rate_type: "fixed",
        rate: "",
        unit: "",
        status: "active",
      });
    }
  }, [service, isOpen, form]);

  const rateTypeOptions: SelectOption[] = [
    { value: "hourly", label: "Hourly" },
    { value: "fixed", label: "Fixed" },
    { value: "custom", label: "Custom" },
  ];

  const statusOptions: SelectOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {service ? "Edit Service" : "Add New Service"}
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
                {/* Basic Information */}
                <div className="space-y-4">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Service name is required" : undefined,
                    }}
                  >
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Service Name"
                          placeholder="Consulting Services"
                          required
                        />
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field name="category">
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Category"
                          placeholder="Professional Services"
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
                          placeholder="Enter service description..."
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Pricing</h3>
                  
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <form.Field name="rate_type">
                      {(field) => (
                        <FormField field={field}>
                          <Select
                            label="Rate Type"
                            options={rateTypeOptions}
                            required
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field
                      name="rate"
                      validators={{
                        onChange: ({ value }) => {
                          if (value && parseFloat(value) < 0) {
                            return "Rate must be a positive number";
                          }
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Rate"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            prefix="$"
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="unit">
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Unit"
                          placeholder="e.g., per hour, per project, per session"
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                {/* Status */}
                <form.Field name="status">
                  {(field) => (
                    <FormField field={field}>
                      <Select
                        label="Status"
                        options={statusOptions}
                        required
                      />
                    </FormField>
                  )}
                </form.Field>

                <div className="mt-6 flex items-center justify-end gap-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Cancel
                  </button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? "Saving..."
                          : service
                            ? "Update Service"
                            : "Create Service"}
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