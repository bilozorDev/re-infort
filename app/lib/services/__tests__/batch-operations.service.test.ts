import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createClientMock,
  createQueryBuilderMock,
  resetSupabaseMocks,
  setSupabaseMockData,
  setSupabaseRpcMockData,
  supabaseMock,
} from "@/test/mocks/supabase";

import {
  batchAdjustInventory,
  batchDeleteProducts,
  batchImportProducts,
  batchStockTransfers,
  batchUpdateProducts,
} from "../batch-operations.service";

// Mock the Supabase client
vi.mock("@/app/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("Batch Operations Service", () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  describe("batchUpdateProducts", () => {
    const mockUpdates = [
      { id: "1", updates: { name: "Updated Product 1", price: 100 } },
      { id: "2", updates: { name: "Updated Product 2", price: 200 } },
    ];
    const organizationId = "org_123";

    it("should successfully update all products", async () => {
      setSupabaseMockData("products", {});

      const result = await batchUpdateProducts(mockUpdates, organizationId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(2);
      expect(result.totalFailed).toBe(0);
      expect(result.successful).toEqual(mockUpdates);
      expect(result.failed).toEqual([]);
    });

    it("should handle partial failures", async () => {
      // Mock the from method to return different results for different calls
      let callCount = 0;
      supabaseMock.from.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          // Second product should fail
          return createQueryBuilderMock(null, { message: "Update failed" });
        }
        // First product should succeed
        return createQueryBuilderMock({ id: "prod_1" }, null);
      });

      const result = await batchUpdateProducts(mockUpdates, organizationId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(1);
      expect(result.totalFailed).toBe(1);
      expect(result.successful).toEqual([mockUpdates[0]]);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].item).toEqual(mockUpdates[1]);
      expect(result.failed[0].error).toBe("Update failed");
    });

    it("should process updates in chunks", async () => {
      const largeUpdates = Array.from({ length: 25 }, (_, i) => ({
        id: `product_${i}`,
        updates: { name: `Product ${i}` },
      }));

      setSupabaseMockData("products", {});

      const result = await batchUpdateProducts(largeUpdates, organizationId, 10);

      expect(result.totalProcessed).toBe(25);
      expect(result.totalSuccess).toBe(25);
    });
  });

  describe("batchAdjustInventory", () => {
    const mockAdjustments = [
      {
        productId: "prod_1",
        warehouseId: "wh_1",
        quantity: 10,
        type: "add" as const,
        reason: "Stock in",
      },
      {
        productId: "prod_2",
        warehouseId: "wh_1",
        quantity: 5,
        type: "remove" as const,
        reason: "Damaged",
      },
    ];
    const userId = "user_123";

    it("should successfully adjust all inventory", async () => {
      const mockRpcResponse = [{ success: true }, { success: true }];
      setSupabaseRpcMockData(mockRpcResponse);

      const result = await batchAdjustInventory(mockAdjustments, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(2);
      expect(result.totalFailed).toBe(0);
      expect(result.successful).toEqual(mockAdjustments);
    });

    it("should handle RPC failures", async () => {
      setSupabaseRpcMockData(null, { message: "RPC failed" });

      const result = await batchAdjustInventory(mockAdjustments, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailed).toBe(2);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].error).toBe("RPC failed");
    });

    it("should handle individual item failures in RPC response", async () => {
      const mockRpcResponse = [{ success: true }, { success: false, error: "Insufficient stock" }];
      setSupabaseRpcMockData(mockRpcResponse);

      const result = await batchAdjustInventory(mockAdjustments, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(1);
      expect(result.totalFailed).toBe(1);
      expect(result.failed[0].error).toBe("Insufficient stock");
    });

    it("should group adjustments by warehouse", async () => {
      const mixedWarehouseAdjustments = [
        { productId: "prod_1", warehouseId: "wh_1", quantity: 10, type: "add" as const },
        { productId: "prod_2", warehouseId: "wh_2", quantity: 5, type: "add" as const },
        { productId: "prod_3", warehouseId: "wh_1", quantity: 3, type: "add" as const },
      ];

      setSupabaseRpcMockData(null);

      await batchAdjustInventory(mixedWarehouseAdjustments, userId);

      // Should be called once per warehouse group
      expect(supabaseMock.rpc).toHaveBeenCalledTimes(2);
    });

    it("should handle different adjustment types correctly", async () => {
      const adjustments = [
        { productId: "prod_1", warehouseId: "wh_1", quantity: 10, type: "add" as const },
        { productId: "prod_2", warehouseId: "wh_1", quantity: 5, type: "remove" as const },
        { productId: "prod_3", warehouseId: "wh_1", quantity: 15, type: "set" as const },
      ];

      setSupabaseRpcMockData(null);

      await batchAdjustInventory(adjustments, userId);

      expect(supabaseMock.rpc).toHaveBeenCalledWith("batch_adjust_inventory", {
        p_adjustments: [
          {
            product_id: "prod_1",
            warehouse_id: "wh_1",
            quantity_change: 10,
            operation_type: "add",
            reason: undefined,
          },
          {
            product_id: "prod_2",
            warehouse_id: "wh_1",
            quantity_change: -5,
            operation_type: "remove",
            reason: undefined,
          },
          {
            product_id: "prod_3",
            warehouse_id: "wh_1",
            quantity_change: 15,
            operation_type: "set",
            reason: undefined,
          },
        ],
        p_user_id: userId,
      });
    });
  });

  describe("batchStockTransfers", () => {
    const mockTransfers = [
      {
        productId: "prod_1",
        fromWarehouseId: "wh_1",
        toWarehouseId: "wh_2",
        quantity: 10,
        reason: "Rebalancing",
      },
      {
        productId: "prod_2",
        fromWarehouseId: "wh_2",
        toWarehouseId: "wh_3",
        quantity: 5,
      },
    ];
    const userId = "user_123";

    it("should successfully transfer all stock", async () => {
      setSupabaseRpcMockData(null);

      const result = await batchStockTransfers(mockTransfers, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(2);
      expect(result.totalFailed).toBe(0);
      expect(result.successful).toEqual(mockTransfers);
    });

    it("should handle transfer failures", async () => {
      let callCount = 0;
      supabaseMock.rpc.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ error: null });
        } else {
          return Promise.resolve({ error: { message: "Insufficient stock" } });
        }
      });

      const result = await batchStockTransfers(mockTransfers, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(1);
      expect(result.totalFailed).toBe(1);
      expect(result.failed[0].error).toBe("Insufficient stock");
    });

    it("should call transfer_inventory RPC with correct parameters", async () => {
      setSupabaseRpcMockData(null);

      await batchStockTransfers(mockTransfers, userId);

      expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
        p_product_id: "prod_1",
        p_from_warehouse_id: "wh_1",
        p_to_warehouse_id: "wh_2",
        p_quantity: 10,
        p_reason: "Rebalancing",
        p_notes: `Batch transfer by ${userId}`,
      });
    });
  });

  describe("batchDeleteProducts", () => {
    const productIds = ["prod_1", "prod_2", "prod_3"];
    const organizationId = "org_123";

    it("should delete products without inventory", async () => {
      // Mock inventory check - no products have inventory
      setSupabaseMockData("inventory", []);

      const result = await batchDeleteProducts(productIds, organizationId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(3);
      expect(result.totalFailed).toBe(0);
      expect(result.successful).toEqual(productIds);
    });

    it("should not delete products with inventory", async () => {
      // Mock inventory check - all products have inventory
      setSupabaseMockData(
        "inventory",
        productIds.map((id) => ({ product_id: id }))
      );

      const result = await batchDeleteProducts(productIds, organizationId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailed).toBe(3);
      expect(result.failed.every((f) => f.error === "Product has existing inventory")).toBe(true);
    });

    it("should handle mixed scenario - some with inventory, some without", async () => {
      // Mock inventory check - only first product has inventory
      setSupabaseMockData("inventory", [{ product_id: "prod_1" }]);

      const result = await batchDeleteProducts(productIds, organizationId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(2); // prod_2, prod_3
      expect(result.totalFailed).toBe(1); // prod_1
      expect(result.successful).toEqual(["prod_2", "prod_3"]);
    });

    it("should handle deletion errors", async () => {
      // Mock deletion failure
      supabaseMock.from.mockImplementation((table) => {
        if (table === "inventory") {
          return createQueryBuilderMock([], null);
        }
        // Products deletion should fail
        return createQueryBuilderMock(null, { message: "Deletion failed" });
      });

      const result = await batchDeleteProducts(productIds, organizationId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailed).toBe(3);
      expect(result.failed.every((f) => f.error === "Deletion failed")).toBe(true);
    });
  });

  describe("batchImportProducts", () => {
    const mockProducts = [
      { name: "Product 1", sku: "SKU001", price: 100 },
      { name: "Product 2", sku: "SKU002", price: 200 },
      { name: "Product 3", sku: "SKU003", price: 300 },
    ];
    const organizationId = "org_123";
    const userId = "user_123";

    it("should successfully import all products", async () => {
      // Mock checking for existing SKUs (should find none)
      supabaseMock.from.mockImplementation((table) => {
        if (table === "products") {
          const mock = createQueryBuilderMock();
          // select().in() should return empty array (no existing SKUs)
          mock.in.mockReturnThis();
          mock.eq.mockReturnThis();
          mock.then = vi.fn((callback) => callback({ data: [], error: null }));
          // insert should return chainable object with select
          mock.insert.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
          });
          return mock;
        }
        return createQueryBuilderMock();
      });

      const result = await batchImportProducts(mockProducts, organizationId, userId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(3);
      expect(result.totalFailed).toBe(0);
      expect(result.successful).toEqual(mockProducts);
    });

    it("should skip duplicate SKUs when skipDuplicates is true", async () => {
      // Mock checking for existing SKUs - SKU001 exists
      supabaseMock.from.mockImplementation((table) => {
        if (table === "products") {
          const mock = createQueryBuilderMock();
          // select().in() should return SKU001 as existing
          mock.in.mockReturnThis();
          mock.eq.mockReturnThis();
          mock.then = vi.fn((callback) => callback({ data: [{ sku: "SKU001" }], error: null }));
          // insert should return chainable object with select for non-duplicates
          mock.insert.mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: mockProducts.filter((p) => p.sku !== "SKU001"),
              error: null,
            }),
          });
          return mock;
        }
        return createQueryBuilderMock();
      });

      const result = await batchImportProducts(mockProducts, organizationId, userId, true);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(2); // SKU002, SKU003
      expect(result.totalFailed).toBe(1); // SKU001 duplicate
      expect(result.failed[0].error).toContain("already exists");
    });

    it("should import duplicates when skipDuplicates is false", async () => {
      setSupabaseMockData(
        "products",
        mockProducts.map((p, i) => ({ ...p, id: `prod_${i}` }))
      );

      const result = await batchImportProducts(mockProducts, organizationId, userId, false);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(3);
      expect(result.totalFailed).toBe(0);
    });

    it("should handle insertion errors", async () => {
      // Mock checking for existing SKUs and insertion failure
      supabaseMock.from.mockImplementation((table) => {
        if (table === "products") {
          const mock = createQueryBuilderMock();
          // select().in() should return empty (no existing SKUs)
          mock.in.mockReturnThis();
          mock.eq.mockReturnThis();
          mock.then = vi.fn((callback) => callback({ data: [], error: null }));
          // insert should return chainable object with select that fails
          mock.insert.mockReturnValue({
            select: vi
              .fn()
              .mockResolvedValue({ data: null, error: { message: "Insertion failed" } }),
          });
          return mock;
        }
        return createQueryBuilderMock();
      });

      const result = await batchImportProducts(mockProducts, organizationId, userId);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailed).toBe(3);
      expect(result.failed.every((f) => f.error === "Insertion failed")).toBe(true);
    });

    it("should handle products without SKUs", async () => {
      const productsWithoutSku = [
        { name: "Product 1", price: 100 },
        { name: "Product 2", sku: "SKU002", price: 200 },
      ];

      // Mock for products without SKUs
      supabaseMock.from.mockImplementation((table) => {
        if (table === "products") {
          const mock = createQueryBuilderMock();
          // select().in() should only check for SKU002
          mock.in.mockReturnThis();
          mock.eq.mockReturnThis();
          mock.then = vi.fn((callback) => callback({ data: [], error: null }));
          // insert should return chainable object with select
          mock.insert.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: productsWithoutSku, error: null }),
          });
          return mock;
        }
        return createQueryBuilderMock();
      });

      const result = await batchImportProducts(productsWithoutSku, organizationId, userId);

      expect(result.totalProcessed).toBe(2);
      expect(result.totalSuccess).toBe(2);
      expect(result.totalFailed).toBe(0);
    });
  });
});
