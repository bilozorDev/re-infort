"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useAdjustStock } from "@/app/hooks/use-inventory";
import { useWarehouses } from "@/app/hooks/use-warehouses";

interface StockAdjustmentModalProps {
  productId: string;
  warehouseId?: string | null;
  type: "add" | "remove";
  isOpen: boolean;
  onClose: () => void;
}

export function StockAdjustmentModal({
  productId,
  warehouseId,
  type,
  isOpen,
  onClose,
}: StockAdjustmentModalProps) {
  const { data: warehouses } = useWarehouses();
  const adjustStock = useAdjustStock();

  const form = useForm({
    defaultValues: {
      warehouseId: warehouseId || "",
      quantity: "",
      reason: "",
      referenceNumber: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await adjustStock.mutateAsync({
          productId,
          warehouseId: value.warehouseId,
          quantity: type === "add" ? parseInt(value.quantity) : -parseInt(value.quantity),
          movementType: type === "add" ? "receipt" : "adjustment",
          reason: value.reason || undefined,
          referenceNumber: value.referenceNumber || undefined,
        });

        onClose();
      } catch (error) {
        console.error("Failed to adjust stock:", error);
      }
    },
  });

  // Update form when warehouseId changes
  useEffect(() => {
    if (warehouseId) {
      form.setFieldValue("warehouseId", warehouseId);
    }
  }, [warehouseId, form]);

  const warehouseOptions =
    warehouses?.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })) || [];

  const isSubmitting = adjustStock.isPending;

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
                {type === "add" ? "Add Stock" : "Remove Stock"}
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
                  name="warehouseId"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (!value) return "Warehouse is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <Select
                        label="Warehouse"
                        required
                        placeholder="Select a warehouse"
                        options={warehouseOptions}
                        disabled={!!warehouseId}
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
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <TextField
                        type="number"
                        label="Quantity"
                        required
                        min="1"
                        placeholder="Enter quantity"
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="referenceNumber">
                  {(field) => (
                    <FormField field={field}>
                      <TextField label="Reference Number" placeholder="e.g., PO-12345" />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="reason">
                  {(field) => (
                    <FormField field={field}>
                      <TextArea
                        label="Reason"
                        rows={3}
                        placeholder={
                          type === "add" ? "e.g., New stock received" : "e.g., Damaged items"
                        }
                      />
                    </FormField>
                  )}
                </form.Field>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !form.state.canSubmit}
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:col-start-2 ${
                      type === "add"
                        ? "bg-green-600 hover:bg-green-500 disabled:bg-green-300"
                        : "bg-red-600 hover:bg-red-500 disabled:bg-red-300"
                    } disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? "Processing..." : type === "add" ? "Add Stock" : "Remove Stock"}
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
