import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagination, useServerPagination } from "../use-pagination";

describe("usePagination", () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  describe("basic functionality", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => usePagination(mockData));

      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(4);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.isFirstPage).toBe(true);
      expect(result.current.isLastPage).toBe(false);
    });

    it("should initialize with custom options", () => {
      const { result } = renderHook(() =>
        usePagination(mockData, {
          initialPageIndex: 2,
          initialPageSize: 10,
          pageSizeOptions: [5, 10, 20],
        })
      );

      expect(result.current.pageIndex).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.pageSizeOptions).toEqual([5, 10, 20]);
      expect(result.current.totalPages).toBe(10);
    });

    it("should return correct current data slice", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      expect(result.current.currentData).toHaveLength(10);
      expect(result.current.currentData[0]).toEqual({ id: 1, name: "Item 1" });
      expect(result.current.currentData[9]).toEqual({ id: 10, name: "Item 10" });
    });

    it("should calculate correct start and end indices", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(9);
    });
  });

  describe("navigation", () => {
    it("should navigate to next page", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.pageIndex).toBe(1);
      expect(result.current.currentData[0]).toEqual({ id: 11, name: "Item 11" });
      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(19);
    });

    it("should navigate to previous page", () => {
      const { result } = renderHook(() =>
        usePagination(mockData, { initialPageIndex: 2, initialPageSize: 10 })
      );

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pageIndex).toBe(1);
      expect(result.current.currentData[0]).toEqual({ id: 11, name: "Item 11" });
    });

    it("should go to specific page", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.pageIndex).toBe(3);
      expect(result.current.currentData[0]).toEqual({ id: 31, name: "Item 31" });
    });

    it("should not go beyond first page", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pageIndex).toBe(0);
    });

    it("should not go beyond last page", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      act(() => {
        result.current.goToPage(15); // Beyond last page
      });

      expect(result.current.pageIndex).toBe(9); // Should be clamped to last page
    });

    it("should handle navigation to invalid page numbers", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      act(() => {
        result.current.goToPage(-5);
      });

      expect(result.current.pageIndex).toBe(0);

      act(() => {
        result.current.goToPage(100);
      });

      expect(result.current.pageIndex).toBe(9); // Last valid page
    });
  });

  describe("page size changes", () => {
    it("should change page size and reset to first page", () => {
      const { result } = renderHook(() =>
        usePagination(mockData, { initialPageIndex: 2, initialPageSize: 10 })
      );

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.pageSize).toBe(20);
      expect(result.current.pageIndex).toBe(0); // Should reset to first page
      expect(result.current.totalPages).toBe(5);
      expect(result.current.currentData).toHaveLength(20);
    });
  });

  describe("page numbers calculation", () => {
    it("should show all pages when total pages is small", () => {
      const smallData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() => usePagination(smallData, { initialPageSize: 25 }));

      expect(result.current.pageNumbers).toEqual([0, 1]);
    });

    it("should limit page numbers when total pages is large", () => {
      const largeData = Array.from({ length: 200 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() => usePagination(largeData, { initialPageSize: 10 }));

      expect(result.current.pageNumbers).toHaveLength(7);
      expect(result.current.pageNumbers).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("should adjust page numbers when near the end", () => {
      const largeData = Array.from({ length: 200 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() =>
        usePagination(largeData, { initialPageIndex: 18, initialPageSize: 10 })
      );

      expect(result.current.pageNumbers).toEqual([13, 14, 15, 16, 17, 18, 19]);
    });

    it("should center page numbers around current page", () => {
      const largeData = Array.from({ length: 200 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() =>
        usePagination(largeData, { initialPageIndex: 10, initialPageSize: 10 })
      );

      expect(result.current.pageNumbers).toEqual([7, 8, 9, 10, 11, 12, 13]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty data", () => {
      const { result } = renderHook(() => usePagination([]));

      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.currentData).toEqual([]);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.isFirstPage).toBe(true);
      expect(result.current.isLastPage).toBe(false); // When totalPages is 0, isLastPage is false
    });

    it("should handle single item", () => {
      const singleItem = [{ id: 1, name: "Single Item" }];
      const { result } = renderHook(() => usePagination(singleItem));

      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.currentData).toEqual(singleItem);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it("should handle page size larger than data", () => {
      const smallData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const { result } = renderHook(() => usePagination(smallData, { initialPageSize: 10 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.currentData).toEqual(smallData);
      expect(result.current.endIndex).toBe(2);
    });
  });

  describe("pagination state flags", () => {
    it("should correctly set flags on first page", () => {
      const { result } = renderHook(() => usePagination(mockData, { initialPageSize: 10 }));

      expect(result.current.isFirstPage).toBe(true);
      expect(result.current.isLastPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it("should correctly set flags on last page", () => {
      const { result } = renderHook(() =>
        usePagination(mockData, { initialPageIndex: 9, initialPageSize: 10 })
      );

      expect(result.current.isFirstPage).toBe(false);
      expect(result.current.isLastPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should correctly set flags on middle page", () => {
      const { result } = renderHook(() =>
        usePagination(mockData, { initialPageIndex: 5, initialPageSize: 10 })
      );

      expect(result.current.isFirstPage).toBe(false);
      expect(result.current.isLastPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });
  });
});

describe("useServerPagination", () => {
  describe("basic functionality", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useServerPagination());

      expect(result.current.pagination.pageIndex).toBe(0);
      expect(result.current.pagination.pageSize).toBe(25);
      expect(result.current.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it("should initialize with custom options", () => {
      const { result } = renderHook(() =>
        useServerPagination({
          initialPageIndex: 3,
          initialPageSize: 50,
          pageSizeOptions: [20, 50, 100],
        })
      );

      expect(result.current.pagination.pageIndex).toBe(3);
      expect(result.current.pagination.pageSize).toBe(50);
      expect(result.current.pageSizeOptions).toEqual([20, 50, 100]);
    });
  });

  describe("navigation", () => {
    it("should navigate to next page", () => {
      const { result } = renderHook(() => useServerPagination());

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.pagination.pageIndex).toBe(1);
    });

    it("should navigate to previous page", () => {
      const { result } = renderHook(() => useServerPagination({ initialPageIndex: 5 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pagination.pageIndex).toBe(4);
    });

    it("should not go below page 0", () => {
      const { result } = renderHook(() => useServerPagination());

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pagination.pageIndex).toBe(0);
    });

    it("should go to specific page", () => {
      const { result } = renderHook(() => useServerPagination());

      act(() => {
        result.current.goToPage(10);
      });

      expect(result.current.pagination.pageIndex).toBe(10);
    });

    it("should not allow negative page numbers", () => {
      const { result } = renderHook(() => useServerPagination());

      act(() => {
        result.current.goToPage(-5);
      });

      expect(result.current.pagination.pageIndex).toBe(0);
    });
  });

  describe("page size changes", () => {
    it("should change page size and reset to first page", () => {
      const { result } = renderHook(() => useServerPagination({ initialPageIndex: 5 }));

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.pagination.pageSize).toBe(50);
      expect(result.current.pagination.pageIndex).toBe(0);
    });
  });

  describe("pagination state management", () => {
    it("should allow direct pagination state updates", () => {
      const { result } = renderHook(() => useServerPagination());

      act(() => {
        result.current.setPagination({
          pageIndex: 10,
          pageSize: 100,
        });
      });

      expect(result.current.pagination.pageIndex).toBe(10);
      expect(result.current.pagination.pageSize).toBe(100);
    });
  });
});
