"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { FormField, TextArea, TextField } from "@/app/components/ui/form";
import type { Client, ClientInsert, ClientUpdate } from "@/app/types/quotes-helpers";

interface ClientFormProps {
  client?: Client;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientInsert | ClientUpdate) => Promise<void>;
}

export default function ClientForm({ client, isOpen, onClose, onSubmit }: ClientFormProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "",
      notes: "",
      tags: [] as string[],
    },
    onSubmit: async ({ value }) => {
      try {
        // Basic validation
        if (!value.name.trim()) {
          toast.error("Client name is required");
          return;
        }

        if (value.email && !isValidEmail(value.email)) {
          toast.error("Please enter a valid email address");
          return;
        }

        await onSubmit(value);
        onClose();
      } catch (error) {
        console.error("Form submission error:", error);
        // Error is handled by parent component
      }
    },
  });

  // Update form when client data changes or modal opens
  useEffect(() => {
    if (client && isOpen) {
      form.reset({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        address: client.address || "",
        city: client.city || "",
        state_province: client.state_province || "",
        postal_code: client.postal_code || "",
        country: client.country || "",
        notes: client.notes || "",
        tags: client.tags || [],
      });
    } else if (!client && isOpen) {
      form.reset({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "",
        notes: "",
        tags: [],
      });
    }
  }, [client, isOpen, form]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {client ? "Edit Client" : "Add New Client"}
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
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Client name is required" : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Name"
                            placeholder="John Doe"
                            required
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="company">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Company"
                            placeholder="Acme Inc."
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field
                      name="email"
                      validators={{
                        onChange: ({ value }) => {
                          if (value && !isValidEmail(value)) {
                            return "Please enter a valid email address";
                          }
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Email"
                            type="email"
                            placeholder="john@example.com"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="phone">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Address</h3>
                  
                  <form.Field name="address">
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Street Address"
                          placeholder="123 Main Street"
                        />
                      </FormField>
                    )}
                  </form.Field>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
                    <form.Field name="city">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="City"
                            placeholder="San Francisco"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="state_province">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="State / Province"
                            placeholder="CA"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="postal_code">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="ZIP / Postal Code"
                            placeholder="94105"
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="country">
                    {(field) => (
                      <FormField field={field}>
                        <TextField
                          label="Country"
                          placeholder="United States"
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Additional Information</h3>
                  
                  <form.Field name="notes">
                    {(field) => (
                      <FormField field={field}>
                        <TextArea
                          label="Notes"
                          rows={3}
                          placeholder="Enter any additional notes about this client..."
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
                    {([canSubmit, isSubmitting]) => (
                      <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? "Saving..."
                          : client
                            ? "Update Client"
                            : "Create Client"}
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