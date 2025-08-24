"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { PageHeader } from "@/app/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useCategoryTemplates } from "@/app/hooks/use-category-templates";
import type { CategoryTemplate } from "@/app/types/category-template";

import ImportProgressDialog from "./ImportProgressDialog";
import TemplateCard from "./TemplateCard";
import TemplateSelectionDialog from "./TemplateSelectionDialog";

export function TemplateLibraryClient() {
  const { data, isLoading } = useCategoryTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CategoryTemplate | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);

  const templates = data?.templates || [];

  // Get unique business types
  const businessTypes = Array.from(new Set(templates.map((t) => t.business_type))).sort();

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.business_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBusinessType =
      !selectedBusinessType || template.business_type === selectedBusinessType;

    return matchesSearch && matchesBusinessType;
  });

  const handleImportStart = (jobId: string) => {
    setImportJobId(jobId);
    setSelectedTemplate(null);
  };

  const handleImportComplete = () => {
    setImportJobId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Library"
        description="Browse and import predefined category structures for your business type"
        backLink={{
          label: "Back to Categories",
          href: "/dashboard/products/categories",
        }}
      />

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search templates..."
            />
          </div>
        </div>

        <div className="sm:w-64">
          <Select
            value={selectedBusinessType || ""}
            onValueChange={(value) => setSelectedBusinessType(value || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Business Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Business Types</SelectItem>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {searchTerm || selectedBusinessType
              ? "No templates found matching your criteria"
              : "No templates available"}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Template Selection Dialog */}
      {selectedTemplate && (
        <TemplateSelectionDialog
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          isOpen={true}
          onClose={() => setSelectedTemplate(null)}
          onImportStart={handleImportStart}
        />
      )}

      {/* Import Progress Dialog */}
      {importJobId && (
        <ImportProgressDialog
          jobId={importJobId}
          isOpen={true}
          onClose={handleImportComplete}
        />
      )}
    </div>
  );
}