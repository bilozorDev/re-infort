"use client";

import { 
  BuildingOfficeIcon,
  EnvelopeIcon, 
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon, 
  TrashIcon 
} from "@heroicons/react/24/outline";

import { type Tables } from "@/app/types/database.types";

type Client = Tables<"clients">;

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export default function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  if (clients.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No clients</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new client.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <ul role="list" className="divide-y divide-gray-100">
        {clients.map((client) => (
          <li key={client.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
            <div className="flex min-w-0 gap-x-4">
              <div className="h-12 w-12 flex-none rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-lg">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {client.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-gray-500">
                  {client.email && (
                    <span className="flex items-center gap-x-1">
                      <EnvelopeIcon className="h-3 w-3" />
                      {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-x-1">
                      <PhoneIcon className="h-3 w-3" />
                      {client.phone}
                    </span>
                  )}
                  {client.company && (
                    <span className="flex items-center gap-x-1">
                      <BuildingOfficeIcon className="h-3 w-3" />
                      {client.company}
                    </span>
                  )}
                  {client.city && client.state_province && (
                    <span className="flex items-center gap-x-1">
                      <MapPinIcon className="h-3 w-3" />
                      {client.city}, {client.state_province}
                    </span>
                  )}
                </div>
                {client.tags && client.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {client.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-2">
              <button
                onClick={() => onEdit(client)}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(client.id)}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}