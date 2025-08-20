"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { AddressAutocomplete, type AddressData } from "@/app/components/ui/address-autocomplete";
import { Checkbox, FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useCreateWarehouse, useUpdateWarehouse, useWarehouse } from "@/app/hooks/use-warehouses";
import { createWarehouseSchema } from "@/app/lib/validations/warehouse";
import type { WarehouseStatus, WarehouseType } from "@/app/types/warehouse";

interface WarehouseFormProps {
  warehouseId: string | null;
  onClose: () => void;
}

export function WarehouseForm({ warehouseId, onClose }: WarehouseFormProps) {
  const { data: warehouse, isLoading } = useWarehouse(warehouseId || undefined);
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const form = useForm({
    defaultValues: {
      name: "",
      type: "office" as WarehouseType,
      status: "active" as WarehouseStatus,
      address: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "United States",
      notes: "",
      is_default: false,
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate with Zod
        const validatedData = createWarehouseSchema.parse(value);

        if (warehouseId) {
          console.log("Updating warehouse:", warehouseId, validatedData);
          await updateWarehouse.mutateAsync({ id: warehouseId, data: validatedData });
        } else {
          console.log("Creating warehouse:", validatedData);
          await createWarehouse.mutateAsync(validatedData);
        }
        onClose();
      } catch (error) {
        console.error("Form submission error:", error);
        // Error is handled by mutation hooks and toast notifications
      }
    },
  });

  // Update form when warehouse data loads
  useEffect(() => {
    if (warehouse) {
      // Reset the form with the warehouse data
      form.reset({
        name: warehouse.name,
        type: warehouse.type as WarehouseType,
        status: warehouse.status as WarehouseStatus,
        address: warehouse.address,
        city: warehouse.city,
        state_province: warehouse.state_province,
        postal_code: warehouse.postal_code,
        country: warehouse.country,
        notes: warehouse.notes || "",
        is_default: warehouse.is_default,
      });
    }
  }, [warehouse, form]);

  const typeOptions = [
    { value: "office", label: "Office" },
    { value: "vehicle", label: "Vehicle" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const countryOptions = [
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "Mexico", label: "Mexico" },
  ];

  const isSubmitting = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            {isLoading && warehouseId ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      {warehouseId ? "Edit Warehouse" : "Add New Warehouse"}
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
                    <div className="space-y-6">
                      {/* Name Field - Full Width */}
                      <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) =>
                            !value ? "Warehouse name is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              label="Warehouse Name"
                              placeholder="Main Warehouse"
                              required
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Type and Status Fields */}
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <form.Field name="type">
                          {(field) => (
                            <FormField field={field}>
                              <Select label="Type" options={typeOptions} required />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field name="status">
                          {(field) => (
                            <FormField field={field}>
                              <Select label="Status" options={statusOptions} required />
                            </FormField>
                          )}
                        </form.Field>
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Location</h3>

                      <form.Field
                        name="address"
                        validators={{
                          onChange: ({ value }) => (!value ? "Address is required" : undefined),
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <AddressAutocomplete
                              label="Street Address"
                              placeholder="123 Main Street"
                              required
                              initialValue={field.state.value}
                              error={field.state.meta.errors.join(", ")}
                              onChange={(value) => field.handleChange(value)}
                              onAddressSelect={(addressData: AddressData) => {
                                console.log("Setting form values with:", addressData);
                                // Update all address fields with the selected data
                                field.handleChange(addressData.address);
                                form.setFieldValue("city", addressData.city);
                                form.setFieldValue("state_province", addressData.state_province);
                                form.setFieldValue("postal_code", addressData.postal_code);
                                form.setFieldValue("country", addressData.country);
                                
                                // Log the form state after setting
                                setTimeout(() => {
                                  console.log("Form values after setting:", {
                                    city: form.getFieldValue("city"),
                                    state_province: form.getFieldValue("state_province"),
                                    postal_code: form.getFieldValue("postal_code"),
                                    country: form.getFieldValue("country"),
                                  });
                                }, 100);
                              }}
                            />
                          </FormField>
                        )}
                      </form.Field>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
                        <form.Field
                          name="city"
                          validators={{
                            onChange: ({ value }) => (!value ? "City is required" : undefined),
                          }}
                        >
                          {(field) => (
                            <FormField field={field}>
                              <TextField label="City" placeholder="San Francisco" required />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field
                          name="state_province"
                          validators={{
                            onChange: ({ value }) =>
                              !value ? "State/Province is required" : undefined,
                          }}
                        >
                          {(field) => (
                            <FormField field={field}>
                              <TextField label="State / Province" placeholder="CA" required />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field
                          name="postal_code"
                          validators={{
                            onChange: ({ value }) =>
                              !value ? "Postal code is required" : undefined,
                          }}
                        >
                          {(field) => (
                            <FormField field={field}>
                              <TextField label="ZIP / Postal Code" placeholder="94105" required />
                            </FormField>
                          )}
                        </form.Field>
                      </div>

                      <form.Field name="country">
                        {(field) => (
                          <FormField field={field}>
                            <Select label="Country" options={countryOptions} required />
                          </FormField>
                        )}
                      </form.Field>
                    </div>

                    {/* Notes Field */}
                    <form.Field name="notes">
                      {(field) => (
                        <FormField field={field}>
                          <TextArea
                            label="Notes"
                            rows={3}
                            placeholder="Enter any additional notes about this warehouse..."
                          />
                        </FormField>
                      )}
                    </form.Field>

                    {/* Default Checkbox */}
                    <form.Field name="is_default">
                      {(field) => (
                        <FormField field={field}>
                          <Checkbox
                            label="Set as default warehouse"
                            description="New inventory items will be assigned to this warehouse by default"
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
                        {([canSubmit]) => (
                          <button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting
                              ? "Saving..."
                              : warehouseId
                                ? "Update Warehouse"
                                : "Create Warehouse"}
                          </button>
                        )}
                      </form.Subscribe>
                    </div>
                  </form>
                </div>
              </>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
