"use client";

import {
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

import { type Tables } from "@/app/types/database.types";

type Contact = Tables<"contacts">;

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
}

export default function ContactList({ 
  contacts, 
  onEdit, 
  onDelete,
  onSetPrimary 
}: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No contacts</h3>
        <p className="mt-1 text-sm text-gray-500">Add contacts to manage communication with this company.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "inactive":
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
      default:
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
      <ul role="list" className="divide-y divide-gray-100">
        {contacts.map((contact) => (
          <li key={contact.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
            <div className="flex min-w-0 gap-x-4">
              <div className="h-10 w-10 flex-none rounded-full bg-gray-50 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-x-2">
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </p>
                  {contact.is_primary && (
                    <StarSolidIcon className="h-4 w-4 text-yellow-400" title="Primary Contact" />
                  )}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(contact.status)}`}>
                    {contact.status || "active"}
                  </span>
                </div>
                
                {(contact.title || contact.department) && (
                  <p className="text-sm text-gray-600">
                    {[contact.title, contact.department].filter(Boolean).join(" • ")}
                  </p>
                )}
                
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-gray-500">
                  {contact.email && (
                    <span className="flex items-center gap-x-1">
                      <EnvelopeIcon className="h-3 w-3" />
                      <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 underline">
                        {contact.email}
                      </a>
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-x-1">
                      <PhoneIcon className="h-3 w-3" />
                      <a href={`tel:${contact.phone}`} className="hover:text-indigo-600">
                        {contact.phone}
                      </a>
                    </span>
                  )}
                  {contact.mobile && (
                    <span className="flex items-center gap-x-1">
                      <PhoneIcon className="h-3 w-3" />
                      <span className="text-xs">Mobile:</span>
                      <a href={`tel:${contact.mobile}`} className="hover:text-indigo-600">
                        {contact.mobile}
                      </a>
                    </span>
                  )}
                </div>

                {contact.notes && (
                  <p className="mt-2 text-xs text-gray-500">{contact.notes}</p>
                )}

                {contact.has_different_address && contact.address && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Address:</span>
                    <p>{contact.address}</p>
                    {(contact.city || contact.state_province || contact.postal_code) && (
                      <p>
                        {[contact.city, contact.state_province, contact.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {contact.country && <p>{contact.country}</p>}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex shrink-0 items-center gap-x-2">
              {!contact.is_primary && (
                <button
                  onClick={() => onSetPrimary(contact.id)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-yellow-600 shadow-sm ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50"
                  title="Set as primary contact"
                >
                  <StarIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(contact)}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                title="Edit contact"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(contact.id)}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                title="Delete contact"
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