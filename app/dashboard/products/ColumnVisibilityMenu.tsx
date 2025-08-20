"use client";

import { Menu, Transition } from "@headlessui/react";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";
import { Fragment } from "react";

import { cn } from "@/app/lib/utils/table";

interface ColumnVisibilityMenuProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityMenu<TData>({ table }: ColumnVisibilityMenuProps<TData>) {
  const columnNames: Record<string, string> = {
    photo: "Photo",
    name: "Product Name",
    sku: "SKU",
    category: "Category",
    cost: "Cost",
    price: "Price",
    status: "Status",
    created_at: "Created Date",
    updated_at: "Updated Date",
    description: "Description",
    features: "Features",
    serial_number: "Serial Number",
    link: "Product Link",
  };

  const allColumns = table.getAllColumns().filter(
    (column) => column.getCanHide()
  );

  const handleToggleAll = (visible: boolean) => {
    allColumns.forEach((column) => {
      column.toggleVisibility(visible);
    });
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
        <ViewColumnsIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Columns
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* Show All / Hide All buttons */}
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Show All
                </button>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Hide All
                </button>
              </div>
            </div>

            {/* Column toggles */}
            <div className="max-h-96 overflow-y-auto">
              {allColumns.map((column) => {
                const columnName = columnNames[column.id] || column.id;
                return (
                  <Menu.Item key={column.id}>
                    {({ active }) => (
                      <label
                        className={cn(
                          active ? "bg-gray-100" : "",
                          "flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={(e) => column.toggleVisibility(e.target.checked)}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="flex-1">{columnName}</span>
                      </label>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}