"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useProductWarehouseInventory, useTransferStock } from "@/app/hooks/use-inventory";

interface TransferModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ productId, isOpen, onClose }: TransferModalProps) {
  const { data: inventory } = useProductWarehouseInventory(productId);
  const transferStock = useTransferStock();

  const form = useForm({
    defaultValues: {
      fromWarehouse: "",
      toWarehouse: "",
      quantity: "",
      reason: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await transferStock.mutateAsync({
          productId,
          fromWarehouseId: value.fromWarehouse,
          toWarehouseId: value.toWarehouse,
          quantity: parseInt(value.quantity),
          reason: value.reason || undefined,
          notes: value.notes || undefined,
        });

        onClose();
      } catch (error) {
        console.error("Failed to transfer stock:", error);
      }
    },
  });

  const availableWarehouses = inventory?.filter((inv) => inv.warehouse_status === "active") || [];

  // Get max quantity for selected warehouse
  const selectedFromWarehouse = form.state.values.fromWarehouse;
  const maxQuantity =
    selectedFromWarehouse && inventory
      ? inventory.find((inv) => inv.warehouse_id === selectedFromWarehouse)?.available_quantity || 0
      : 0;

  // Update toWarehouse options when fromWarehouse changes
  useEffect(() => {
    const fromValue = form.state.values.fromWarehouse;
    const toValue = form.state.values.toWarehouse;

    if (fromValue && fromValue === toValue) {
      form.setFieldValue("toWarehouse", "");
    }
  }, [form.state.values.fromWarehouse, form.state.values.toWarehouse, form]);

  const fromWarehouseOptions = availableWarehouses
    .filter((inv) => inv.available_quantity > 0)
    .map((inv) => ({
      value: inv.warehouse_id,
      label: `${inv.warehouse_name} (Available: ${inv.available_quantity})`,
    }));

  const toWarehouseOptions = availableWarehouses
    .filter((inv) => inv.warehouse_id !== form.state.values.fromWarehouse)
    .map((inv) => ({
      value: inv.warehouse_id,
      label: inv.warehouse_name,
    }));

  const isSubmitting = transferStock.isPending;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Tailwind v4 uses fractional opacity values instead of opacity classes */}
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                Transfer Stock Between Warehouses
              </DialogTitle>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="mt-6 space-y-4"
              >
                <form.Field
                  name="fromWarehouse"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (!value) return "Source warehouse is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <Select
                        label="From Warehouse"
                        required
                        placeholder="Select source warehouse"
                        options={fromWarehouseOptions}
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field
                  name="toWarehouse"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (!value) return "Destination warehouse is required";
                      if (value === form.state.values.fromWarehouse) {
                        return "Cannot transfer to the same warehouse";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <Select
                        label="To Warehouse"
                        required
                        placeholder="Select destination warehouse"
                        options={toWarehouseOptions}
                        disabled={!form.state.values.fromWarehouse}
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field
                  name="quantity"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (!value) return "Quantity is required";
                      const num = parseInt(value);
                      if (isNaN(num) || num <= 0) return "Quantity must be a positive number";
                      if (num > maxQuantity)
                        return `Cannot transfer more than ${maxQuantity} items`;
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field} showError={field.state.meta.isTouched}>
                      <TextField
                        type="number"
                        label="Quantity"
                        required
                        min="1"
                        max={maxQuantity}
                        placeholder={
                          maxQuantity > 0 ? `Max: ${maxQuantity}` : "Select source warehouse first"
                        }
                        disabled={!form.state.values.fromWarehouse || maxQuantity === 0}
                        helperText={
                          form.state.values.fromWarehouse && maxQuantity === 0
                            ? "No available stock in selected warehouse"
                            : undefined
                        }
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="reason">
                  {(field) => (
                    <FormField field={field}>
                      <TextField label="Reason" placeholder="e.g., Rebalancing inventory" />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="notes">
                  {(field) => (
                    <FormField field={field}>
                      <TextArea
                        label="Notes"
                        rows={3}
                        placeholder="Additional notes about this transfer"
                      />
                    </FormField>
                  )}
                </form.Field>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !form.state.canSubmit || maxQuantity === 0}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed sm:col-start-2"
                  >
                    {isSubmitting ? "Transferring..." : "Transfer Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
