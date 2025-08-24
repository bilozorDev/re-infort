"use client";

import { useUser } from "@clerk/nextjs";
import { Cog6ToothIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect,useState } from "react";
import { toast } from "sonner";

import { type Tables } from "@/app/types/database.types";

import { PageHeader } from "@/app/components/ui/page-header";
import { useServiceCategories } from "@/app/hooks/use-service-categories";

import ServiceForm from "./ServiceForm";
import ServiceList from "./ServiceList";

type Service = Tables<"services">;

export default function ServicesClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("active");
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const response = await fetch("/api/user/role");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      };
      checkAdmin();
    }
  }, [user]);

  // Fetch service categories
  const { data: categories } = useServiceCategories();

  // Fetch services
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ["services", searchQuery, selectedCategory, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      params.append("status", selectedStatus);
      
      const response = await fetch(`/api/services?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create service");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsFormOpen(false);
      toast.success("Service created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditingService(null);
      toast.success("Service updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete service");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (data: Partial<Service>) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    if (!isAdmin) {
      toast.error("Only administrators can edit services");
      return;
    }
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete services");
      return;
    }
    if (confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  // Calculate stats
  const activeServices = servicesData?.data?.filter((s: Service) => s.status === "active").length || 0;
  const categoriesCount = categories?.length || 0;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Services"
        description="Manage your service catalog and pricing for quotes"
        primaryAction={isAdmin ? {
          label: "Add Service",
          onClick: () => setIsFormOpen(true),
          icon: PlusIcon,
        } : undefined}
        secondaryActions={isAdmin ? [
          {
            label: "Manage Categories",
            href: "/dashboard/services/categories",
            icon: Cog6ToothIcon,
          },
        ] : []}
      />

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search services..."
            />
          </div>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {servicesData && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Services</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {servicesData.data?.length || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Services</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {activeServices}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {categoriesCount}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="mt-2 text-sm text-gray-500">Loading services...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">Error loading services. Please try again.</p>
          </div>
        ) : (
          <ServiceList
            services={servicesData?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Service Form Modal */}
      {isFormOpen && (
        <ServiceForm
          service={editingService}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}