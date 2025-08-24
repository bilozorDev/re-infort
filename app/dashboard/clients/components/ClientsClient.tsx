"use client";

import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/app/components/ui/page-header";
import { type Tables } from "@/app/types/database.types";

import ClientForm from "./ClientForm";
import ClientList from "./ClientList";

type Client = Tables<"clients">;

export default function ClientsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ["clients", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    },
  });

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create client");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsFormOpen(false);
      toast.success("Client created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update client");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditingClient(null);
      toast.success("Client updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete client");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (data: Partial<Client>) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Clients"
        description="Manage your clients and customers for quotes and sales"
        primaryAction={{
          label: "Add Client",
          onClick: () => setIsFormOpen(true),
          icon: PlusIcon,
        }}
      />

      {/* Search Bar */}
      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search clients by name, email, company, or phone..."
          />
        </div>
      </div>

      {/* Stats */}
      {clientsData && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {clientsData.data?.length || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">With Email</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {clientsData.data?.filter((c: Client) => c.email).length || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Companies</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {new Set(clientsData.data?.filter((c: Client) => c.company).map((c: Client) => c.company)).size || 0}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="mt-2 text-sm text-gray-500">Loading clients...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">Error loading clients. Please try again.</p>
          </div>
        ) : (
          <ClientList
            clients={clientsData?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Client Form Modal */}
      {isFormOpen && (
        <ClientForm
          client={editingClient}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}