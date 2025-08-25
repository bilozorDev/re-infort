"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { SelectOption } from "@/app/components/ui/form";
import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import StepIndicator, { type Step } from "@/app/components/ui/StepIndicator";
import type { Client, QuoteItemInsert } from "@/app/types/quotes-helpers";
import { formatCurrency } from "@/app/utils/formatters";

import ItemSearch from "./ItemSearch";
import QuoteItemsList from "./QuoteItemsList";

interface QuoteItem extends Omit<QuoteItemInsert, 'quote_id'> {
  id: string;
  subtotal: number;
}

interface ItemSearchResult {
  id: string;
  type: 'product' | 'service' | 'custom';
  name: string;
  description?: string;
  price?: number;
  rate?: number;
  warehouse_id?: string;
}

interface QuoteFormData {
  client_id?: string;
  company_id?: string;
  assigned_to_clerk_user_id?: string;
  valid_from?: string;
  valid_until?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  tax_rate?: number;
  terms_and_conditions?: string;
  notes?: string;
  internal_notes?: string;
}

interface QuoteBuilderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuoteBuilderForm({ isOpen, onClose }: QuoteBuilderFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showItemSearch, setShowItemSearch] = useState(false);

  const steps: Step[] = [
    {
      name: "Client & Details",
      status: currentStep === 0 ? "current" : currentStep > 0 ? "complete" : "upcoming",
    },
    {
      name: "Items & Pricing",
      status: currentStep === 1 ? "current" : currentStep > 1 ? "complete" : "upcoming",
    },
    {
      name: "Terms & Notes",
      status: currentStep === 2 ? "current" : currentStep > 2 ? "complete" : "upcoming",
    },
  ];

  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      return data.data;
    },
    enabled: isOpen,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create quote");
      return response.json();
    },
    onSuccess: async (quote) => {
      // Add items to the quote
      if (items.length > 0) {
        const itemsData = items.map((item) => ({
          item_type: item.item_type || 'custom',
          product_id: item.product_id,
          service_id: item.service_id,
          warehouse_id: item.warehouse_id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
        }));

        const response = await fetch(`/api/quotes/${quote.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsData }),
        });

        if (!response.ok) {
          toast.error("Failed to add items to quote");
        }
      }

      toast.success("Quote created successfully");
      router.push(`/dashboard/quotes/${quote.id}`);
    },
    onError: () => {
      toast.error("Failed to create quote");
    },
  });

  const form = useForm({
    defaultValues: {
      client_id: "",
      valid_from: format(new Date(), "yyyy-MM-dd"),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      discount_type: "none" as "none" | "percentage" | "fixed",
      discount_value: "",
      tax_rate: "",
      terms_and_conditions: "",
      notes: "",
      internal_notes: "",
      status: "draft" as "draft" | "sent",
    },
    onSubmit: async ({ value }) => {
      // Only allow submission from the last step
      if (currentStep !== steps.length - 1) {
        return;
      }

      if (!value.client_id) {
        toast.error("Please select a client");
        setCurrentStep(0);
        return;
      }

      const quoteData = {
        client_id: value.client_id,
        status: value.status,
        valid_from: value.valid_from,
        valid_until: value.valid_until,
        discount_type: value.discount_type === "none" ? null : value.discount_type,
        discount_value: value.discount_type === "none" ? 0 : parseFloat(value.discount_value) || 0,
        tax_rate: parseFloat(value.tax_rate) || 0,
        terms_and_conditions: value.terms_and_conditions || null,
        notes: value.notes || null,
        internal_notes: value.internal_notes || null,
      };

      createQuoteMutation.mutate(quoteData);
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setItems([]);
      setShowItemSearch(false);
      form.reset();
    }
  }, [isOpen, form]);

  const clientOptions: SelectOption[] = clients?.map((client: Client) => ({
    value: client.id,
    label: client.company ? `${client.name} (${client.company})` : client.name,
  })) || [];

  const discountTypeOptions: SelectOption[] = [
    { value: "none", label: "No Discount" },
    { value: "percentage", label: "Percentage" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  const handleAddItem = (item: ItemSearchResult) => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      item_type: item.type,
      product_id: item.type === "product" ? item.id : undefined,
      service_id: item.type === "service" ? item.id : undefined,
      warehouse_id: item.warehouse_id,
      name: item.name || '',
      description: item.description,
      quantity: 1,
      unit_price: item.price || item.rate || 0,
      subtotal: item.price || item.rate || 0,
    };
    setItems([...items, newItem]);
    setShowItemSearch(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<QuoteItem>) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      ...updates,
    };
    
    // Recalculate subtotal
    const item = updatedItems[index];
    let subtotal = (item.quantity || 1) * (item.unit_price || 0);
    
    if (item.discount_type === "percentage" && item.discount_value) {
      subtotal -= subtotal * (item.discount_value / 100);
    } else if (item.discount_type === "fixed" && item.discount_value) {
      subtotal -= item.discount_value;
    }
    
    updatedItems[index].subtotal = Math.max(0, subtotal);
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountType = form.store.state.values.discount_type;
  const discountValue = parseFloat(form.store.state.values.discount_value) || 0;
  const taxRate = parseFloat(form.store.state.values.tax_rate) || 0;
  
  let discountAmount = 0;
  if (discountType === "percentage" && discountValue > 0) {
    discountAmount = itemsSubtotal * (discountValue / 100);
  } else if (discountType === "fixed" && discountValue > 0) {
    discountAmount = discountValue;
  }
  
  const afterDiscount = itemsSubtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const canGoToNextStep = () => {
    switch (currentStep) {
      case 0:
        return !!form.store.state.values.client_id;
      case 1:
        return true; // Can proceed even without items
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleStepChange = (newStep: number) => {
    if (newStep < currentStep) {
      setCurrentStep(newStep);
    } else if (newStep === currentStep + 1 && canGoToNextStep()) {
      setCurrentStep(newStep);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep < steps.length - 1 && canGoToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isSubmitting = createQuoteMutation.isPending;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Create New Quote
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <StepIndicator steps={steps} onStepClick={handleStepChange} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-6"
              >
                {/* Step 1: Client & Details */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <form.Field
                      name="client_id"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Please select a client" : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <Select
                            label="Client"
                            options={clientOptions}
                            placeholder="Select a client"
                            required
                            disabled={loadingClients}
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                      <form.Field name="valid_from">
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              label="Valid From"
                              type="date"
                              required
                            />
                          </FormField>
                        )}
                      </form.Field>

                      <form.Field name="valid_until">
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              label="Valid Until"
                              type="date"
                              required
                            />
                          </FormField>
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}

                {/* Step 2: Items & Pricing */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Quote Items</h3>
                      {items.length > 0 && (
                        <QuoteItemsList
                          items={items.map(item => ({
                            ...item,
                            type: item.item_type as "product" | "service" | "custom"
                          }))}
                          onUpdateItem={handleUpdateItem}
                          onRemoveItem={handleRemoveItem}
                        />
                      )}
                      
                      {showItemSearch ? (
                        <ItemSearch
                          onSelectItem={handleAddItem}
                          onCancel={() => setShowItemSearch(false)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowItemSearch(true)}
                          className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Item
                        </button>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Pricing & Discounts</h3>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <form.Field name="discount_type">
                          {(field) => (
                            <FormField field={field}>
                              <Select
                                label="Discount Type"
                                options={discountTypeOptions}
                              />
                            </FormField>
                          )}
                        </form.Field>

                        {form.store.state.values.discount_type !== "none" && (
                          <form.Field name="discount_value">
                            {(field) => (
                              <FormField field={field}>
                                <TextField
                                  label="Discount Value"
                                  type="number"
                                  step="0.01"
                                  placeholder={form.store.state.values.discount_type === "percentage" ? "%" : "Amount"}
                                  min="0"
                                  prefix={form.store.state.values.discount_type === "fixed" ? "$" : undefined}
                                />
                              </FormField>
                            )}
                          </form.Field>
                        )}

                        <form.Field name="tax_rate">
                          {(field) => (
                            <FormField field={field}>
                              <TextField
                                label="Tax Rate (%)"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                min="0"
                                max="100"
                              />
                            </FormField>
                          )}
                        </form.Field>
                      </div>

                      <div className="mt-4 border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>{formatCurrency(itemsSubtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        {taxAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax ({taxRate}%)</span>
                            <span>{formatCurrency(taxAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Terms & Notes */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <form.Field name="terms_and_conditions">
                      {(field) => (
                        <FormField field={field}>
                          <TextArea
                            label="Terms and Conditions"
                            rows={4}
                            placeholder="Enter terms and conditions..."
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="notes">
                      {(field) => (
                        <FormField field={field}>
                          <TextArea
                            label="Customer Notes"
                            rows={3}
                            placeholder="Notes visible to the customer..."
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="internal_notes">
                      {(field) => (
                        <FormField field={field}>
                          <TextArea
                            label="Internal Notes"
                            rows={3}
                            placeholder="Internal notes (not visible to customer)..."
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="status">
                      {(field) => (
                        <FormField field={field}>
                          <Select
                            label="Initial Status"
                            options={[
                              { value: "draft", label: "Save as Draft" },
                              { value: "sent", label: "Create and Send" },
                            ]}
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-x-3">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm font-semibold text-gray-900"
                    >
                      Cancel
                    </button>

                    {currentStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canGoToNextStep()}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    ) : (
                      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                        {([canSubmit]) => (
                          <button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Creating..." : "Create Quote"}
                          </button>
                        )}
                      </form.Subscribe>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}