"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Tab } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import toast from "react-hot-toast";

import { AddressAutocomplete, type AddressData } from "@/app/components/ui/address-autocomplete";
import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { type Tables } from "@/app/types/database.types";

type Company = Tables<"companies">;
type Contact = Tables<"contacts">;

interface CompanyWithContacts extends Company {
  contacts?: Contact[];
}

interface CompanyFormData {
  name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  status?: string;
  primaryContact?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    title?: string;
    department?: string;
  };
}

interface CompanyFormProps {
  company: CompanyWithContacts | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => void;
  isSubmitting: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CompanyForm({
  company,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CompanyFormProps) {
  const form = useForm({
    defaultValues: company ? {
      // Company fields
      name: company.name || "",
      website: company.website || "",
      industry: company.industry || "",
      company_size: company.company_size || "",
      tax_id: company.tax_id || "",
      address: company.address || "",
      city: company.city || "",
      state_province: company.state_province || "",
      postal_code: company.postal_code || "",
      country: company.country || "",
      notes: company.notes || "",
      status: company.status || "active",
      // Primary contact (if editing, we don't show contact fields)
      primaryContact: undefined,
    } : {
      // Company fields
      name: "",
      website: "",
      industry: "",
      company_size: "",
      tax_id: "",
      address: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "",
      notes: "",
      status: "active",
      // Primary contact fields
      primaryContact: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        mobile: "",
        title: "",
        department: "",
      },
    },
    onSubmit: async ({ value }) => {
      try {
        // Basic validation
        if (!value.name?.trim()) {
          toast.error("Company name is required");
          return;
        }

        // Only validate contact if creating new company
        if (!company) {
          if (!value.primaryContact?.first_name || !value.primaryContact?.last_name) {
            toast.error("Contact first and last names are required");
            return;
          }
          if (value.primaryContact?.email && !isValidEmail(value.primaryContact.email)) {
            toast.error("Please enter a valid email address for the contact");
            return;
          }
        }

        if (value.website && !isValidUrl(value.website)) {
          toast.error("Please enter a valid website URL");
          return;
        }

        const submitData = {
          ...value,
          primaryContact: !company ? value.primaryContact : undefined,
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

  const isValidUrl = (url: string): boolean => {
    try {
      // Add protocol if missing
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlWithProtocol);
      return true;
    } catch {
      return false;
    }
  };

  const tabs = company ? ['Company Details'] : ['Basic', 'Advanced'];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {company ? "Edit Company" : "Add New Company"}
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
              >
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                    {tabs.map((tab) => (
                      <Tab
                        key={tab}
                        className={({ selected }) =>
                          classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                            'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                          )
                        }
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tab.List>
                  
                  <Tab.Panels>
                    {company ? (
                      // Edit mode - single panel with all company fields
                      <Tab.Panel className="space-y-6">
                        {/* Company Information */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                            <form.Field
                              name="name"
                              validators={{
                                onChange: ({ value }) =>
                                  !value ? "Company name is required" : undefined,
                              }}
                            >
                              {(field) => (
                                <FormField field={field}>
                                  <TextField
                                    label="Company Name"
                                    placeholder="Acme Inc."
                                    required
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
                                      { value: "prospect", label: "Prospect" },
                                      { value: "archived", label: "Archived" },
                                    ]}
                                  />
                                </FormField>
                              )}
                            </form.Field>

                            <form.Field name="website">
                              {(field) => (
                                <FormField field={field}>
                                  <TextField
                                    label="Website"
                                    placeholder="www.example.com"
                                  />
                                </FormField>
                              )}
                            </form.Field>

                            <form.Field name="industry">
                              {(field) => (
                                <FormField field={field}>
                                  <TextField
                                    label="Industry"
                                    placeholder="Technology"
                                  />
                                </FormField>
                              )}
                            </form.Field>

                            <form.Field name="company_size">
                              {(field) => (
                                <FormField field={field}>
                                  <Select
                                    label="Company Size"
                                    options={[
                                      { value: "", label: "Select size" },
                                      { value: "1-10", label: "1-10 employees" },
                                      { value: "11-50", label: "11-50 employees" },
                                      { value: "51-200", label: "51-200 employees" },
                                      { value: "201-500", label: "201-500 employees" },
                                      { value: "501-1000", label: "501-1000 employees" },
                                      { value: "1000+", label: "1000+ employees" },
                                    ]}
                                  />
                                </FormField>
                              )}
                            </form.Field>

                            <form.Field name="tax_id">
                              {(field) => (
                                <FormField field={field}>
                                  <TextField
                                    label="Tax ID"
                                    placeholder="12-3456789"
                                  />
                                </FormField>
                              )}
                            </form.Field>
                          </div>

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

                          <form.Field name="notes">
                            {(field) => (
                              <FormField field={field}>
                                <TextArea
                                  label="Notes"
                                  rows={3}
                                  placeholder="Enter any additional notes about this company..."
                                />
                              </FormField>
                            )}
                          </form.Field>
                        </div>
                      </Tab.Panel>
                    ) : (
                      // Create mode - two tabs
                      <>
                        <Tab.Panel className="space-y-6">
                          {/* Basic Tab - Company Name, Address, and Primary Contact */}
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Company Information</h3>
                              <form.Field
                                name="name"
                                validators={{
                                  onChange: ({ value }) =>
                                    !value ? "Company name is required" : undefined,
                                }}
                              >
                                {(field) => (
                                  <FormField field={field}>
                                    <TextField
                                      label="Company Name"
                                      placeholder="Acme Inc."
                                      required
                                    />
                                  </FormField>
                                )}
                              </form.Field>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Address</h3>
                              <div className="space-y-4">
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
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Primary Contact</h3>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                <form.Field
                                  name="primaryContact.first_name"
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
                                  name="primaryContact.last_name"
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
                                  name="primaryContact.email"
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

                                <form.Field name="primaryContact.phone">
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
                          </div>
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          {/* Advanced Tab - Additional Company Details */}
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Company Details</h3>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                <form.Field 
                                  name="website"
                                  validators={{
                                    onChange: ({ value }) => {
                                      if (value && !isValidUrl(value)) {
                                        return "Please enter a valid website URL";
                                      }
                                      return undefined;
                                    },
                                  }}
                                >
                                  {(field) => (
                                    <FormField field={field}>
                                      <TextField
                                        label="Website"
                                        placeholder="www.example.com"
                                      />
                                    </FormField>
                                  )}
                                </form.Field>

                                <form.Field name="industry">
                                  {(field) => (
                                    <FormField field={field}>
                                      <TextField
                                        label="Industry"
                                        placeholder="Technology"
                                      />
                                    </FormField>
                                  )}
                                </form.Field>

                                <form.Field name="company_size">
                                  {(field) => (
                                    <FormField field={field}>
                                      <Select
                                        label="Company Size"
                                        options={[
                                          { value: "", label: "Select size" },
                                          { value: "1-10", label: "1-10 employees" },
                                          { value: "11-50", label: "11-50 employees" },
                                          { value: "51-200", label: "51-200 employees" },
                                          { value: "201-500", label: "201-500 employees" },
                                          { value: "501-1000", label: "501-1000 employees" },
                                          { value: "1000+", label: "1000+ employees" },
                                        ]}
                                      />
                                    </FormField>
                                  )}
                                </form.Field>

                                <form.Field name="tax_id">
                                  {(field) => (
                                    <FormField field={field}>
                                      <TextField
                                        label="Tax ID"
                                        placeholder="12-3456789"
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
                                          { value: "prospect", label: "Prospect" },
                                          { value: "archived", label: "Archived" },
                                        ]}
                                      />
                                    </FormField>
                                  )}
                                </form.Field>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Details</h3>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                <form.Field name="primaryContact.mobile">
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

                                <form.Field name="primaryContact.title">
                                  {(field) => (
                                    <FormField field={field}>
                                      <TextField
                                        label="Title"
                                        placeholder="CEO"
                                      />
                                    </FormField>
                                  )}
                                </form.Field>

                                <form.Field name="primaryContact.department">
                                  {(field) => (
                                    <FormField field={field}>
                                      <TextField
                                        label="Department"
                                        placeholder="Executive"
                                      />
                                    </FormField>
                                  )}
                                </form.Field>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Additional Information</h3>
                              <form.Field name="notes">
                                {(field) => (
                                  <FormField field={field}>
                                    <TextArea
                                      label="Notes"
                                      rows={3}
                                      placeholder="Enter any additional notes about this company..."
                                    />
                                  </FormField>
                                )}
                              </form.Field>
                            </div>
                          </div>
                        </Tab.Panel>
                      </>
                    )}
                  </Tab.Panels>
                </Tab.Group>

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
                        {isSubmitting ? "Saving..." : company ? "Update Company" : "Create Company"}
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