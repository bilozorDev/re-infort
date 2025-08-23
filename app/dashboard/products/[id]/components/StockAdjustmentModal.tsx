"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { useAdjustStock, useProductWarehouseInventory } from "@/app/hooks/use-inventory";
import { useWarehouses } from "@/app/hooks/use-warehouses";

interface StockAdjustmentModalProps {
  productId: string;
  warehouseId?: string | null;
  type: "add" | "remove";
  isOpen: boolean;
  onClose: () => void;
}

const movementTypeOptionsAdd = [
  { value: "receipt", label: "Receipt - New stock from supplier" },
  { value: "return", label: "Return - Customer return" },
  { value: "adjustment", label: "Adjustment - Inventory correction" },
];

const movementTypeOptionsRemove = [
  { value: "sale", label: "Sale - Stock sold/shipped" },
  { value: "damage", label: "Damage - Damaged or lost items" },
  { value: "production", label: "Production - Used in manufacturing" },
  { value: "adjustment", label: "Adjustment - Inventory correction" },
];

const referencePlaceholders: Record<string, string> = {
  receipt: "e.g., PO-12345",
  sale: "e.g., SO-12345",
  return: "e.g., RMA-12345",
  damage: "e.g., DMG-12345",
  production: "e.g., BATCH-12345",
  adjustment: "e.g., ADJ-12345",
  transfer: "e.g., TRF-12345",
};

export function StockAdjustmentModal({
  productId,
  warehouseId,
  type,
  isOpen,
  onClose,
}: StockAdjustmentModalProps) {
  const { data: warehouses } = useWarehouses();
  const { data: inventory } = useProductWarehouseInventory(productId);
  const adjustStock = useAdjustStock();

  const form = useForm({
    defaultValues: {
      warehouseId: warehouseId || "",
      quantity: "",
      movementType: type === "add" ? "receipt" : "sale",
      reason: "",
      referenceNumber: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await adjustStock.mutateAsync({
          productId,
          warehouseId: value.warehouseId,
          quantity: type === "add" ? parseInt(value.quantity) : -parseInt(value.quantity),
          movementType: value.movementType,
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

  // Get active warehouses with inventory information
  const activeWarehouses = warehouses?.filter((w) => w.status === "active") || [];

  // Create warehouse options based on operation type
  const warehouseOptions = activeWarehouses.map((warehouse) => {
    const warehouseInventory = inventory?.find((inv) => inv.warehouse_id === warehouse.id);
    const currentStock = warehouseInventory?.quantity || 0;
    const availableStock = warehouseInventory?.available_quantity || 0;

    if (type === "remove") {
      return {
        value: warehouse.id,
        label:
          availableStock > 0
            ? `${warehouse.name} (Available: ${availableStock})`
            : `${warehouse.name} (No stock available)`,
        disabled: availableStock === 0,
      };
    } else {
      // For "add" operation, show current stock
      return {
        value: warehouse.id,
        label: `${warehouse.name} (Current: ${currentStock})`,
        disabled: false,
      };
    }
  });

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
                      // For remove operation, check if warehouse has stock
                      if (type === "remove") {
                        const selectedWarehouse = warehouseOptions.find((w) => w.value === value);
                        if (selectedWarehouse?.disabled) {
                          return "Selected warehouse has no available stock";
                        }
                      }
                      return undefined;
                    },
                  }}
                  listeners={{
                    onChange: () => {
                      // Reset quantity when warehouse changes
                      form.setFieldValue("quantity", "");
                      form.setFieldMeta("quantity", (prev) => ({ ...prev, isTouched: false }));
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
                    onChangeListenTo: ["warehouseId"],
                    onChange: ({ value, fieldApi }) => {
                      // Skip validation if field hasn't been touched and is empty
                      if (!fieldApi.state.meta.isTouched && !value) {
                        return undefined;
                      }
                      if (!value) return "Quantity is required";
                      const num = parseInt(value);
                      if (isNaN(num) || num <= 0) return "Quantity must be a positive number";

                      // For remove operation, validate against available stock
                      if (type === "remove") {
                        const selectedWarehouseId = fieldApi.form.getFieldValue("warehouseId");
                        const warehouseInventory = inventory?.find(
                          (inv) => inv.warehouse_id === selectedWarehouseId
                        );
                        const availableStock = warehouseInventory?.available_quantity || 0;

                        if (num > availableStock) {
                          return `Cannot remove more than ${availableStock} items`;
                        }
                      }

                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    // Get selected warehouse data for dynamic UI
                    const selectedWarehouseId = form.state.values.warehouseId;
                    const warehouseInventory =
                      selectedWarehouseId && inventory
                        ? inventory.find((inv) => inv.warehouse_id === selectedWarehouseId)
                        : null;
                    const availableStock = warehouseInventory?.available_quantity || 0;
                    const currentStock = warehouseInventory?.quantity || 0;

                    // Determine if field should be disabled
                    const isDisabled =
                      type === "remove"
                        ? !selectedWarehouseId || availableStock === 0
                        : !selectedWarehouseId;

                    // Dynamic placeholder based on operation type
                    const placeholder =
                      type === "remove"
                        ? selectedWarehouseId
                          ? availableStock > 0
                            ? `Max: ${availableStock}`
                            : "No stock available"
                          : "Select warehouse first"
                        : selectedWarehouseId
                          ? `Current stock: ${currentStock}`
                          : "Select warehouse first";

                    // Helper text for remove operation with no stock
                    const helperText =
                      type === "remove" && selectedWarehouseId && availableStock === 0
                        ? "No available stock in selected warehouse"
                        : undefined;

                    return (
                      <FormField field={field} showError={field.state.meta.isTouched}>
                        <TextField
                          type="number"
                          label="Quantity"
                          required
                          min="1"
                          max={type === "remove" ? availableStock : undefined}
                          placeholder={placeholder}
                          disabled={isDisabled}
                          helperText={helperText}
                        />
                      </FormField>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="movementType"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (!value) return "Movement type is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <FormField field={field}>
                      <Select
                        label="Movement Type"
                        required
                        placeholder="Select movement type"
                        options={type === "add" ? movementTypeOptionsAdd : movementTypeOptionsRemove}
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="referenceNumber">
                  {(field) => {
                    const movementType = form.state.values.movementType;
                    const placeholder = referencePlaceholders[movementType] || "e.g., REF-12345";
                    
                    return (
                      <FormField field={field}>
                        <TextField label="Reference Number" placeholder={placeholder} />
                      </FormField>
                    );
                  }}
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
