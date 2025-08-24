"use client";

import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { cn } from "@/app/lib/utils/table";

import HighlightText from "./HighlightText";

interface ProductLinkProps {
  productId: string;
  productName: string;
  searchQuery?: string;
  className?: string;
}

export function ProductLink({ productId, productName, searchQuery, className }: ProductLinkProps) {
  return (
    <Link
      href={`/dashboard/products/${productId}`}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors",
        className
      )}
    >
      <HighlightText text={productName} searchQuery={searchQuery} />
      <EyeIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-indigo-600" />
    </Link>
  );
}
