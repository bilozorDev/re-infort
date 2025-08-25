"use client";

import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/app/components/ui/page-header";
import { type Tables } from "@/app/types/database.types";

import CompanyForm from "./CompanyForm";
import CompanyList from "./CompanyList";

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

export default function CompaniesClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithContacts | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ["companies", searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      params.append("withContacts", "true");
      
      const response = await fetch(`/api/companies?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create company");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsFormOpen(false);
      toast.success("Company created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update company");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setEditingCompany(null);
      toast.success("Company updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete company");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (data: CompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company: CompanyWithContacts) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to archive company");
      }
      
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company archived successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive company");
    }
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Companies"
        description="Manage your companies and their contacts"
        primaryAction={{
          label: "Add Company",
          onClick: () => setIsFormOpen(true),
          icon: PlusIcon,
        }}
      />

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search companies by name, website, or industry..."
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {companiesData && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Companies</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {companiesData.data?.length || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {companiesData.data?.filter((c: Company) => c.status === "active").length || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {companiesData.data?.reduce((sum: number, c: CompanyWithContacts) => 
                  sum + (c.contacts?.length || 0), 0) || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Prospects</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {companiesData.data?.filter((c: Company) => c.status === "prospect").length || 0}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Companies List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="mt-2 text-sm text-gray-500">Loading companies...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">Error loading companies. Please try again.</p>
          </div>
        ) : (
          <CompanyList
            companies={companiesData?.data || []}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        )}
      </div>

      {/* Company Form Modal */}
      {isFormOpen && (
        <CompanyForm
          key={editingCompany?.id || 'new'}
          company={editingCompany}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}