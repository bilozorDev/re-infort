import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthenticatedMock, createUnauthenticatedMock } from "@/app/test-utils/clerk-mocks";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";
import {
  createClientMock,
  resetSupabaseMocks,
  setSupabaseRpcMockData,
  supabaseMock,
} from "@/test/mocks/supabase";

import { POST } from "../route";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/utils/user");
vi.mock("@/app/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("Inventory Transfer API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
  });

  describe("POST /api/inventory/transfer", () => {
    const validTransferRequest = {
      productId: "prod_1",
      fromWarehouseId: "wh_1",
      toWarehouseId: "wh_2",
      quantity: 10,
      reason: "Rebalancing stock",
      notes: "Moving excess inventory",
    };

    const createMockRequest = (body: unknown): NextRequest =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as unknown as NextRequest;

    it("should successfully transfer inventory", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      setSupabaseRpcMockData({ success: true });

      const request = createMockRequest(validTransferRequest);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true, data: { success: true } });
      expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
        p_product_id: "prod_1",
        p_from_warehouse_id: "wh_1",
        p_to_warehouse_id: "wh_2",
        p_quantity: 10,
        p_reason: "Rebalancing stock",
        p_notes: "Moving excess inventory",
        p_user_name: "Test User",
      });
    });

    it("should handle transfers without optional fields", async () => {
      const minimalRequest = {
        productId: "prod_1",
        fromWarehouseId: "wh_1",
        toWarehouseId: "wh_2",
        quantity: 5,
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      setSupabaseRpcMockData({ success: true });

      const request = createMockRequest(minimalRequest);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
        p_product_id: "prod_1",
        p_from_warehouse_id: "wh_1",
        p_to_warehouse_id: "wh_2",
        p_quantity: 5,
        p_reason: undefined,
        p_notes: undefined,
        p_user_name: "Test User",
      });
    });

    describe("Authentication and Authorization", () => {
      it("should return 401 when user is not authenticated", async () => {
        vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ error: "Unauthorized" });
      });

      it("should return 403 when user is not admin", async () => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(false);

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({
          error: "Only administrators can transfer inventory",
        });
      });

      it("should return 404 when organization is not found", async () => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockResolvedValue(null);

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ error: "Organization not found" });
      });
    });

    describe("Input Validation", () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      });

      it("should return 400 when productId is missing", async () => {
        const invalidRequest = {
          fromWarehouseId: "wh_1",
          toWarehouseId: "wh_2",
          quantity: 10,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should return 400 when fromWarehouseId is missing", async () => {
        const invalidRequest = {
          productId: "prod_1",
          toWarehouseId: "wh_2",
          quantity: 10,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should return 400 when toWarehouseId is missing", async () => {
        const invalidRequest = {
          productId: "prod_1",
          fromWarehouseId: "wh_1",
          quantity: 10,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should return 400 when quantity is missing", async () => {
        const invalidRequest = {
          productId: "prod_1",
          fromWarehouseId: "wh_1",
          toWarehouseId: "wh_2",
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should return 400 when quantity is zero", async () => {
        const invalidRequest = {
          ...validTransferRequest,
          quantity: 0,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        // Zero is falsy so it fails the "missing required fields" check first
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should return 400 when quantity is negative", async () => {
        const invalidRequest = {
          ...validTransferRequest,
          quantity: -5,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Quantity must be a positive number",
        });
      });

      it("should return 400 when transferring to same warehouse", async () => {
        const invalidRequest = {
          ...validTransferRequest,
          fromWarehouseId: "wh_1",
          toWarehouseId: "wh_1",
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Cannot transfer to the same warehouse",
        });
      });
    });

    describe("Database Operations", () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      });

      it("should handle RPC errors", async () => {
        setSupabaseRpcMockData(null, { message: "Insufficient inventory" });

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({
          error: "Insufficient inventory",
        });
      });

      it("should handle RPC errors without message", async () => {
        setSupabaseRpcMockData(null, { code: "TRANSFER_FAILED" });

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({
          error: "Failed to transfer inventory",
        });
      });

      it("should return data from successful RPC call", async () => {
        const expectedData = {
          transferId: "transfer_123",
          fromInventoryUpdated: true,
          toInventoryUpdated: true,
          movementRecorded: true,
        };

        setSupabaseRpcMockData(expectedData);

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({
          success: true,
          data: expectedData,
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle JSON parsing errors", async () => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");

        const request = {
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        } as unknown as NextRequest;

        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: "Internal server error" });
      });

      it("should handle auth service errors", async () => {
        vi.mocked(auth).mockRejectedValue(new Error("Auth service down"));

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: "Internal server error" });
      });

      it("should handle role checking errors", async () => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockRejectedValue(new Error("Role service error"));

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: "Internal server error" });
      });

      it("should handle organization retrieval errors", async () => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockRejectedValue(new Error("Org service error"));

        const request = createMockRequest(validTransferRequest);
        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: "Internal server error" });
      });
    });

    describe("Edge Cases", () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
        vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      });

      it("should handle empty string fields", async () => {
        const invalidRequest = {
          productId: "",
          fromWarehouseId: "wh_1",
          toWarehouseId: "wh_2",
          quantity: 10,
        };

        const request = createMockRequest(invalidRequest);
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({
          error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity",
        });
      });

      it("should handle decimal quantities", async () => {
        const decimalQuantityRequest = {
          ...validTransferRequest,
          quantity: 10.5,
        };

        setSupabaseRpcMockData({ success: true });

        const request = createMockRequest(decimalQuantityRequest);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
          p_product_id: "prod_1",
          p_from_warehouse_id: "wh_1",
          p_to_warehouse_id: "wh_2",
          p_quantity: 10.5,
          p_reason: "Rebalancing stock",
          p_notes: "Moving excess inventory",
          p_user_name: "Test User",
        });
      });

      it("should handle large quantities", async () => {
        const largeQuantityRequest = {
          ...validTransferRequest,
          quantity: 999999,
        };

        setSupabaseRpcMockData({ success: true });

        const request = createMockRequest(largeQuantityRequest);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
          p_product_id: "prod_1",
          p_from_warehouse_id: "wh_1",
          p_to_warehouse_id: "wh_2",
          p_quantity: 999999,
          p_reason: "Rebalancing stock",
          p_notes: "Moving excess inventory",
          p_user_name: "Test User",
        });
      });

      it("should handle long reason and notes", async () => {
        const longTextRequest = {
          ...validTransferRequest,
          reason: "A".repeat(500),
          notes: "B".repeat(1000),
        };

        setSupabaseRpcMockData({ success: true });

        const request = createMockRequest(longTextRequest);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(supabaseMock.rpc).toHaveBeenCalledWith("transfer_inventory", {
          p_product_id: "prod_1",
          p_from_warehouse_id: "wh_1",
          p_to_warehouse_id: "wh_2",
          p_quantity: 10,
          p_reason: "A".repeat(500),
          p_notes: "B".repeat(1000),
          p_user_name: "Test User",
        });
      });
    });
  });
});
