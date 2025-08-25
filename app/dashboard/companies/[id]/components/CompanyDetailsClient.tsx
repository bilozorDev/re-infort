"use client";

import { 
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/app/components/ui/page-header";
import { type Tables } from "@/app/types/database.types";

import ContactForm from "./ContactForm";
import ContactList from "./ContactList";

type Company = Tables<"companies">;
type Contact = Tables<"contacts">;

interface CompanyDetailsClientProps {
  companyId: string;
}

export default function CompanyDetailsClient({ companyId }: CompanyDetailsClientProps) {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch company details
  const { data: company, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}?withContacts=false`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/companies");
          throw new Error("Company not found");
        }
        throw new Error("Failed to fetch company");
      }
      return response.json();
    },
  });

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/contacts`);
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      return response.json();
    },
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/companies/${companyId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setIsContactFormOpen(false);
      toast.success("Contact created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: any }) => {
      const response = await fetch(`/api/companies/${companyId}/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update contact");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setEditingContact(null);
      setIsContactFormOpen(false);
      toast.success("Contact updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/companies/${companyId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete contact");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleContactSubmit = (data: any) => {
    if (editingContact) {
      updateContactMutation.mutate({ contactId: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactFormOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set primary contact");
      }
      
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      toast.success("Primary contact updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set primary contact");
    }
  };

  const handleCloseContactForm = () => {
    setIsContactFormOpen(false);
    setEditingContact(null);
  };

  if (companyLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        <p className="mt-2 text-sm text-gray-500">Loading company details...</p>
      </div>
    );
  }

  if (companyError || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">Error loading company. Please try again.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "inactive":
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
      case "prospect":
        return "bg-blue-50 text-blue-700 ring-blue-700/10";
      case "archived":
        return "bg-yellow-50 text-yellow-800 ring-yellow-600/20";
      default:
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={company.name}
        description="Company details and contacts"
        backLink={{
          href: "/dashboard/companies",
          label: "Back to Companies",
        }}
        primaryAction={{
          label: "Edit Company",
          onClick: () => router.push("/dashboard/companies"),
        }}
      />

      {/* Company Details */}
      <div className="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-x-4">
              <div className="h-12 w-12 flex-none rounded-full bg-indigo-50 flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">{company.name}</h2>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(company.status)}`}>
                    {company.status || "active"}
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {company.website && (
                    <div className="flex items-center gap-x-2 text-sm text-gray-500">
                      <GlobeAltIcon className="h-4 w-4" />
                      <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="hover:text-indigo-600 underline">
                        {company.website}
                      </a>
                    </div>
                  )}
                  
                  {company.industry && (
                    <div className="flex items-center gap-x-2 text-sm text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  
                  {company.company_size && (
                    <div className="flex items-center gap-x-2 text-sm text-gray-500">
                      <UserIcon className="h-4 w-4" />
                      <span>{company.company_size} employees</span>
                    </div>
                  )}
                  
                  {(company.city || company.state_province) && (
                    <div className="flex items-center gap-x-2 text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4" />
                      <span>
                        {[company.city, company.state_province, company.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  
                  {company.tax_id && (
                    <div className="flex items-center gap-x-2 text-sm text-gray-500">
                      <span className="font-medium">Tax ID:</span>
                      <span>{company.tax_id}</span>
                    </div>
                  )}
                </div>

                {company.address && (
                  <div className="mt-3 text-sm text-gray-500">
                    <p className="font-medium">Address:</p>
                    <p>{company.address}</p>
                    {(company.city || company.state_province || company.postal_code) && (
                      <p>
                        {[company.city, company.state_province, company.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {company.country && <p>{company.country}</p>}
                  </div>
                )}

                {company.notes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-500">Notes:</p>
                    <p className="mt-1 text-sm text-gray-700">{company.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Contacts</h3>
          <button
            onClick={() => setIsContactFormOpen(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Contact
          </button>
        </div>

        {contactsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <p className="mt-2 text-sm text-gray-500">Loading contacts...</p>
          </div>
        ) : (
          <ContactList
            contacts={contacts || []}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            onSetPrimary={handleSetPrimary}
          />
        )}
      </div>

      {/* Contact Form Modal */}
      {isContactFormOpen && (
        <ContactForm
          key={editingContact?.id || 'new'}
          contact={editingContact}
          isOpen={isContactFormOpen}
          onClose={handleCloseContactForm}
          onSubmit={handleContactSubmit}
          isSubmitting={createContactMutation.isPending || updateContactMutation.isPending}
        />
      )}
    </div>
  );
}