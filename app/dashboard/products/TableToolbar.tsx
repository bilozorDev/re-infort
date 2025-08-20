"use client";

import { Menu, Transition } from "@headlessui/react";
import { 
  AdjustmentsHorizontalIcon,
  ArrowPathIcon, 
  Squares2X2Icon,
  TableCellsIcon} from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";
import { Fragment } from "react";

import { useTablePreferences } from "@/app/hooks/use-user-preferences";
import { cn } from "@/app/lib/utils/table";

import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";

interface TableToolbarProps<TData> {
  table: Table<TData>;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  tableKey: string;
  isAdmin: boolean;
}

export function TableToolbar<TData>({ 
  table, 
  viewMode, 
  onViewModeChange, 
  tableKey,
  isAdmin 
}: TableToolbarProps<TData>) {
  const { preferences, updatePreferences, resetPreferences, isUpdating } = useTablePreferences(tableKey, isAdmin);
  
  const density = preferences?.density || "normal";
  
  const handleDensityChange = (newDensity: "compact" | "normal" | "comfortable") => {
    updatePreferences({ density: newDensity });
  };
  
  const handleResetPreferences = () => {
    if (confirm("Reset all table preferences to defaults?")) {
      resetPreferences();
    }
  };
  
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left side - view mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewModeChange("list")}
          className={cn(
            "inline-flex items-center gap-x-1.5 rounded px-3 py-1.5 text-sm font-medium",
            viewMode === "list"
              ? "bg-gray-200 text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <TableCellsIcon className="h-4 w-4" />
          List
        </button>
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "inline-flex items-center gap-x-1.5 rounded px-3 py-1.5 text-sm font-medium",
            viewMode === "grid"
              ? "bg-gray-200 text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <Squares2X2Icon className="h-4 w-4" />
          Grid
        </button>
      </div>
      
      {/* Right side - table controls */}
      <div className="flex items-center gap-2">
        {/* Density selector */}
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <AdjustmentsHorizontalIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Density
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleDensityChange("compact")}
                      className={cn(
                        active ? "bg-gray-100" : "",
                        density === "compact" ? "bg-gray-50 font-medium" : "",
                        "block w-full text-left px-4 py-2 text-sm text-gray-700"
                      )}
                    >
                      Compact
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleDensityChange("normal")}
                      className={cn(
                        active ? "bg-gray-100" : "",
                        density === "normal" ? "bg-gray-50 font-medium" : "",
                        "block w-full text-left px-4 py-2 text-sm text-gray-700"
                      )}
                    >
                      Normal
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleDensityChange("comfortable")}
                      className={cn(
                        active ? "bg-gray-100" : "",
                        density === "comfortable" ? "bg-gray-50 font-medium" : "",
                        "block w-full text-left px-4 py-2 text-sm text-gray-700"
                      )}
                    >
                      Comfortable
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        
        {/* Column visibility */}
        <ColumnVisibilityMenu table={table} />
        
        {/* Reset preferences */}
        <button
          onClick={handleResetPreferences}
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          title="Reset to default settings"
        >
          <ArrowPathIcon className={cn("-ml-0.5 h-5 w-5", isUpdating && "animate-spin")} aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}