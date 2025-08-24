"use client";

import { 
  ClockIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  TagIcon,
  TrashIcon 
} from "@heroicons/react/24/outline";

import HighlightText from "@/app/components/ui/HighlightText";
import { type Tables } from "@/app/types/database.types";

type ServiceCategory = Tables<"service_categories">;
type Service = Tables<"services"> & {
  service_category?: ServiceCategory | null;
};

interface ServiceListProps {
  services: Service[];
  searchQuery?: string;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export default function ServiceList({ services, searchQuery, onEdit, onDelete, isAdmin }: ServiceListProps) {
  const formatRate = (service: Service) => {
    if (!service.rate) return "Custom pricing";
    
    const formattedRate = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(service.rate);

    if (service.rate_type === "hourly") {
      return `${formattedRate}/hr`;
    } else if (service.rate_type === "fixed") {
      return formattedRate;
    } else {
      return `${formattedRate} ${service.unit || ""}`;
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No services</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? "Get started by creating a new service." : "No services have been created yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <ul role="list" className="divide-y divide-gray-100">
        {services.map((service) => (
          <li key={service.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
            <div className="flex min-w-0 gap-x-4">
              <div className="h-12 w-12 flex-none rounded-full bg-indigo-50 flex items-center justify-center">
                {service.rate_type === "hourly" ? (
                  <ClockIcon className="h-6 w-6 text-indigo-600" />
                ) : service.rate_type === "fixed" ? (
                  <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                ) : (
                  <TagIcon className="h-6 w-6 text-indigo-600" />
                )}
              </div>
              <div className="min-w-0 flex-auto">
                <div className="flex items-start gap-x-3">
                  <HighlightText 
                    text={service.name}
                    searchQuery={searchQuery}
                    className="text-sm font-semibold leading-6 text-gray-900"
                  />
                  {service.status === "inactive" && (
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      Inactive
                    </span>
                  )}
                </div>
                {service.description && (
                  <HighlightText
                    text={service.description}
                    searchQuery={searchQuery}
                    className="mt-1 text-sm leading-5 text-gray-500 line-clamp-2"
                  />
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-gray-500">
                  <span className="flex items-center gap-x-1">
                    <CurrencyDollarIcon className="h-3 w-3" />
                    {formatRate(service)}
                  </span>
                  {service.service_category && (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {service.service_category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex shrink-0 items-center gap-x-2">
                <button
                  onClick={() => onEdit(service)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(service.id)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}