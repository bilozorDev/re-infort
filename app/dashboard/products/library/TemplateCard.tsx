"use client";

import {
  BuildingOfficeIcon,
  CubeIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import type { CategoryTemplate } from "@/app/types/category-template";

interface TemplateCardProps {
  template: CategoryTemplate;
  onSelect: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  server: BuildingOfficeIcon,
  "shopping-cart": ShoppingCartIcon,
  factory: WrenchScrewdriverIcon,
  default: CubeIcon,
};

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = iconMap[template.icon || "default"] || iconMap.default;

  return (
    <div className="relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        {template.usage_count > 0 && (
          <span className="text-xs text-gray-500">
            Used {template.usage_count} time{template.usage_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
      <p className="mt-1 text-sm text-indigo-600">{template.business_type}</p>
      
      {template.description && (
        <p className="mt-3 flex-1 text-sm text-gray-600 line-clamp-3">
          {template.description}
        </p>
      )}

      <button
        onClick={onSelect}
        className="mt-6 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Preview & Import
      </button>
    </div>
  );
}