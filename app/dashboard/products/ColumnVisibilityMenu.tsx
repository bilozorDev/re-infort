"use client";

import { Popover, Transition } from "@headlessui/react";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import { type Table } from "@tanstack/react-table";
import { Fragment, useEffect, useState } from "react";

interface ColumnVisibilityMenuProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityMenu<TData>({ table }: ColumnVisibilityMenuProps<TData>) {
  // Track visibility state locally
  const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({});

  // Initialize and sync with table state
  useEffect(() => {
    const currentVisibility: Record<string, boolean> = {};
    table.getAllColumns().forEach((column) => {
      if (column.getCanHide()) {
        currentVisibility[column.id] = column.getIsVisible();
      }
    });
    setLocalVisibility(currentVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]); // Re-sync when table changes

  const columnNames: Record<string, string> = {
    photo: "Photo",
    name: "Product Name",
    sku: "SKU",
    category: "Category",
    quantity: "Quantity",
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

  const allColumns = table.getAllColumns().filter((column) => column.getCanHide());

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none">
            <ViewColumnsIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            View
          </Popover.Button>

          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-2">
                {/* Column toggles */}
                <div className="max-h-96 overflow-y-auto">
                  {allColumns.map((column) => {
                    const columnName = columnNames[column.id] || column.id;
                    const isVisible = localVisibility[column.id] ?? column.getIsVisible();

                    return (
                      <label
                        key={column.id}
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            // Toggle the column
                            column.toggleVisibility();
                            // Update local state immediately
                            setLocalVisibility((prev) => ({
                              ...prev,
                              [column.id]: !prev[column.id],
                            }));
                          }}
                          className="mr-3 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="flex-1">{columnName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
