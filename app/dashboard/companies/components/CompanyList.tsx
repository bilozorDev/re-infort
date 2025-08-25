"use client";

import { 
  ArchiveBoxIcon,
  BuildingOfficeIcon,
  EnvelopeIcon, 
  GlobeAltIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon, 
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import HighlightText from "@/app/components/ui/HighlightText";
import { type Tables } from "@/app/types/database.types";

type Company = Tables<"companies">;
type Contact = Tables<"contacts">;

interface CompanyWithContacts extends Company {
  contacts?: Contact[];
}

interface CompanyListProps {
  companies: CompanyWithContacts[];
  searchQuery?: string;
  onEdit: (company: CompanyWithContacts) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function CompanyList({ 
  companies, 
  searchQuery, 
  onEdit, 
  onDelete,
  onArchive 
}: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No companies</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new company.</p>
      </div>
    );
  }

  const getPrimaryContact = (contacts?: Contact[]) => {
    if (!contacts || contacts.length === 0) return null;
    return contacts.find(c => c.is_primary) || contacts[0];
  };

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
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <ul role="list" className="divide-y divide-gray-100">
        {companies.map((company) => {
          const primaryContact = getPrimaryContact(company.contacts);
          
          return (
            <li key={company.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
              <div className="flex min-w-0 gap-x-4">
                <div className="h-12 w-12 flex-none rounded-full bg-indigo-50 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-auto">
                  <div className="flex items-center gap-x-2">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      <HighlightText text={company.name} searchQuery={searchQuery} />
                    </p>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(company.status)}`}>
                      {company.status || "active"}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-gray-500">
                    {company.website && (
                      <span className="flex items-center gap-x-1">
                        <GlobeAltIcon className="h-3 w-3" />
                        <HighlightText text={company.website} searchQuery={searchQuery} />
                      </span>
                    )}
                    {company.industry && (
                      <span className="flex items-center gap-x-1">
                        <BuildingOfficeIcon className="h-3 w-3" />
                        <HighlightText text={company.industry} searchQuery={searchQuery} />
                      </span>
                    )}
                    {company.city && company.state_province && (
                      <span className="flex items-center gap-x-1">
                        <MapPinIcon className="h-3 w-3" />
                        {company.city}, {company.state_province}
                      </span>
                    )}
                  </div>

                  {primaryContact && (
                    <div className="mt-2 flex items-center gap-x-2 text-xs text-gray-500">
                      <UserIcon className="h-3 w-3" />
                      <span className="font-medium">Primary Contact:</span>
                      <span>{primaryContact.first_name} {primaryContact.last_name}</span>
                      {primaryContact.email && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-x-1">
                            <EnvelopeIcon className="h-3 w-3" />
                            {primaryContact.email}
                          </span>
                        </>
                      )}
                      {primaryContact.phone && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-x-1">
                            <PhoneIcon className="h-3 w-3" />
                            {primaryContact.phone}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {company.contacts && company.contacts.length > 1 && (
                    <div className="mt-1 text-xs text-gray-500">
                      +{company.contacts.length - 1} more contact{company.contacts.length > 2 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex shrink-0 items-center gap-x-2">
                <button
                  onClick={() => onEdit(company)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  title="Edit company"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                {company.status !== "archived" && (
                  <button
                    onClick={() => onArchive(company.id)}
                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-yellow-600 shadow-sm ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50"
                    title="Archive company"
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(company.id)}
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                  title="Delete company"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}