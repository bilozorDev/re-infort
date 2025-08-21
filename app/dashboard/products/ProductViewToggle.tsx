"use client";

import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/20/solid";

interface ProductViewToggleProps {
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export function ProductViewToggle({ viewMode, onViewModeChange }: ProductViewToggleProps) {
  return (
    <div className="flex items-center rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        className={`
          relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium
          ${viewMode === "list" 
            ? "bg-indigo-600 text-white hover:bg-indigo-500" 
            : "bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
          }
          focus:z-10
        `}
        aria-label="List view"
      >
        <ListBulletIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("grid")}
        className={`
          relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium
          ${viewMode === "grid" 
            ? "bg-indigo-600 text-white hover:bg-indigo-500" 
            : "bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
          }
          focus:z-10
        `}
        aria-label="Grid view"
      >
        <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}