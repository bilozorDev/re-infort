"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import toast from "react-hot-toast";

import { AddressAutocomplete, type AddressData } from "@/app/components/ui/address-autocomplete";
import { Checkbox, FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { type Tables } from "@/app/types/database.types";

type Contact = Tables<"contacts">;

interface ContactFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  is_primary?: boolean;
  preferred_contact_method?: string;
  has_different_address?: boolean;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  birthday?: string;
}

interface ContactFormProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  isSubmitting: boolean;
}

export default function ContactForm({
  contact,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ContactFormProps) {
  const [hasDifferentAddress, setHasDifferentAddress] = useState(contact?.has_different_address || false);

  const form = useForm({
    defaultValues: contact ? {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      title: contact.title || "",
      department: contact.department || "",
      is_primary: contact.is_primary || false,
      preferred_contact_method: contact.preferred_contact_method || "",
      has_different_address: contact.has_different_address || false,
      address: contact.address || "",
      city: contact.city || "",
      state_province: contact.state_province || "",
      postal_code: contact.postal_code || "",
      country: contact.country || "",
      notes: contact.notes || "",
      birthday: contact.birthday || "",
      status: contact.status || "active",
    } : {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      mobile: "",
      title: "",
      department: "",
      is_primary: false,
      preferred_contact_method: "",
      has_different_address: false,
      address: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "",
      notes: "",
      birthday: "",
      status: "active",
    },
    onSubmit: async ({ value }) => {
      try {
        // Basic validation
        if (!value.first_name?.trim() || !value.last_name?.trim()) {
          toast.error("First and last names are required");
          return;
        }

        if (value.email && !isValidEmail(value.email)) {
          toast.error("Please enter a valid email address");
          return;
        }

        // Clean up address fields if not using different address
        const submitData = {
          ...value,
          has_different_address: hasDifferentAddress,
          address: hasDifferentAddress ? value.address : undefined,
          city: hasDifferentAddress ? value.city : undefined,
          state_province: hasDifferentAddress ? value.state_province : undefined,
          postal_code: hasDifferentAddress ? value.postal_code : undefined,
          country: hasDifferentAddress ? value.country : undefined,
        };

        onSubmit(submitData);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
  });

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
                  {contact ? "Edit Contact" : "Add New Contact"}
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
                  <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <form.Field
                      name="first_name"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "First name is required" : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="First Name"
                            placeholder="John"
                            required
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field
                      name="last_name"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Last name is required" : undefined,
                      }}
                    >
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Last Name"
                            placeholder="Doe"
                            required
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

                    <form.Field name="mobile">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Mobile"
                            type="tel"
                            placeholder="(555) 987-6543"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="preferred_contact_method">
                      {(field) => (
                        <FormField field={field}>
                          <Select
                            label="Preferred Contact Method"
                            options={[
                              { value: "", label: "Select preference" },
                              { value: "email", label: "Email" },
                              { value: "phone", label: "Phone" },
                              { value: "mobile", label: "Mobile" },
                            ]}
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Professional Information</h3>
                  
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <form.Field name="title">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Title"
                            placeholder="CEO"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="department">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Department"
                            placeholder="Executive"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="birthday">
                      {(field) => (
                        <FormField field={field}>
                          <TextField
                            label="Birthday"
                            type="date"
                          />
                        </FormField>
                      )}
                    </form.Field>

                    <form.Field name="status">
                      {(field) => (
                        <FormField field={field}>
                          <Select
                            label="Status"
                            options={[
                              { value: "active", label: "Active" },
                              { value: "inactive", label: "Inactive" },
                            ]}
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="is_primary">
                    {(field) => (
                      <FormField field={field}>
                        <Checkbox
                          label="Set as primary contact"
                          description="Primary contacts are shown first and used for default communications"
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                {/* Different Address Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasDifferentAddress}
                      onChange={(e) => {
                        setHasDifferentAddress(e.target.checked);
                        form.setFieldValue("has_different_address", e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-900">
                      Use different address from company
                    </label>
                  </div>

                  {hasDifferentAddress && (
                    <>
                      <form.Field name="address">
                        {(field) => (
                          <FormField field={field}>
                            <AddressAutocomplete
                              label="Street Address"
                              placeholder="123 Main Street"
                              initialValue={field.state.value}
                              error={field.state.meta.errors.join(", ")}
                              onChange={(value) => field.handleChange(value)}
                              onAddressSelect={(addressData: AddressData) => {
                                field.handleChange(addressData.address);
                                form.setFieldValue("city", addressData.city);
                                form.setFieldValue("state_province", addressData.state_province);
                                form.setFieldValue("postal_code", addressData.postal_code);
                                form.setFieldValue("country", addressData.country);
                              }}
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
                    </>
                  )}
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
                          placeholder="Enter any additional notes about this contact..."
                        />
                      </FormField>
                    )}
                  </form.Field>
                </div>

                {/* Form Actions */}
                <div className="mt-6 flex items-center justify-end gap-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Cancel
                  </button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit]) => (
                      <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
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