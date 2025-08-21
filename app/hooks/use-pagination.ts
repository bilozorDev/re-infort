import { useCallback, useMemo, useState } from "react";

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface PaginationOptions {
  initialPageIndex?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginationResult<T> {
  // Current page data
  currentData: T[];
  // Pagination state
  pageIndex: number;
  pageSize: number;
  // Total counts
  totalItems: number;
  totalPages: number;
  // Page info
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  // Actions
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  // Range info
  startIndex: number;
  endIndex: number;
  // UI helpers
  pageNumbers: number[];
  pageSizeOptions: number[];
}

/**
 * Hook for client-side pagination
 */
export function usePagination<T>(
  data: T[],
  options?: PaginationOptions
): PaginationResult<T> {
  const {
    initialPageIndex = 0,
    initialPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100],
  } = options || {};

  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Calculate current page data
  const currentData = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageIndex, pageSize]);

  // Page navigation
  const nextPage = useCallback(() => {
    setPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    setPageIndex(validPage);
  }, [totalPages]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    // Reset to first page when changing page size
    setPageIndex(0);
  }, []);

  // Calculate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const maxPagesToShow = 7;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    
    let start = Math.max(0, pageIndex - halfRange);
    let end = Math.min(totalPages - 1, pageIndex + halfRange);
    
    // Adjust if we're near the beginning or end
    if (pageIndex <= halfRange) {
      end = Math.min(totalPages - 1, maxPagesToShow - 1);
    } else if (pageIndex >= totalPages - halfRange - 1) {
      start = Math.max(0, totalPages - maxPagesToShow);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [pageIndex, totalPages]);

  // Calculate index range
  const startIndex = pageIndex * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  return {
    // Data
    currentData,
    // State
    pageIndex,
    pageSize,
    // Counts
    totalItems,
    totalPages,
    // Flags
    hasNextPage: pageIndex < totalPages - 1,
    hasPreviousPage: pageIndex > 0,
    isFirstPage: pageIndex === 0,
    isLastPage: pageIndex === totalPages - 1,
    // Actions
    nextPage,
    previousPage,
    goToPage,
    setPageSize: handleSetPageSize,
    // Range
    startIndex,
    endIndex,
    // UI helpers
    pageNumbers,
    pageSizeOptions,
  };
}

/**
 * Hook for server-side pagination with React Query
 */
export function useServerPagination(
  options?: PaginationOptions
) {
  const {
    initialPageIndex = 0,
    initialPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100],
  } = options || {};

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  });

  const nextPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: prev.pageIndex + 1,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      pageIndex: Math.max(0, page),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPagination({
      pageIndex: 0, // Reset to first page
      pageSize: size,
    });
  }, []);

  return {
    pagination,
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    pageSizeOptions,
  };
}

// Pagination UI component has been moved to a separate file
// Import from @/app/components/PaginationControls