import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

import { POST } from "../route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/supabase/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/utils/user");

describe("Inventory Adjust API Route", () => {
  let mockAuth: ReturnType<typeof vi.fn>;
  let mockIsAdmin: ReturnType<typeof vi.fn>;
  let mockGetCurrentOrgId: ReturnType<typeof vi.fn>;
  let mockGetCurrentUserName: ReturnType<typeof vi.fn>;
  let mockSupabase: {
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuth = vi.mocked(auth);
    mockIsAdmin = vi.mocked(isAdmin);
    mockGetCurrentOrgId = vi.mocked(getCurrentOrgId);
    mockGetCurrentUserName = vi.mocked(getCurrentUserName);

    mockSupabase = {
      rpc: vi.fn().mockReturnValue({
        data: { success: true },
        error: null,
      }),
    };

    // @ts-expect-error - Mocking Supabase client
    vi.mocked(createClient).mockResolvedValue(mockSupabase);

    mockAuth.mockResolvedValue({ userId: "user-123" } as never);
    mockIsAdmin.mockResolvedValue(true);
    mockGetCurrentOrgId.mockResolvedValue("org-123");
    mockGetCurrentUserName.mockResolvedValue("Test User");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/inventory/adjust", () => {
    it("should successfully adjust inventory with all required fields", async () => {
      const requestBody = {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 10,
        movementType: "ADJUSTMENT",
        reason: "Stock count correction",
        referenceNumber: "REF-001",
      };

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(_data).toEqual({ success: true, data: { success: true } });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("adjust_inventory", {
        p_product_id: "prod-1",
        p_warehouse_id: "wh-1",
        p_quantity_change: 10,
        p_movement_type: "ADJUSTMENT",
        p_reason: "Stock count correction",
        p_reference_number: "REF-001",
        p_reference_type: null,
        p_user_name: "Test User",
      });
    });

    it("should successfully adjust inventory without optional fields", async () => {
      const requestBody = {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: -5,
        movementType: "DAMAGE",
      };

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("adjust_inventory", {
        p_product_id: "prod-1",
        p_warehouse_id: "wh-1",
        p_quantity_change: -5,
        p_movement_type: "DAMAGE",
        p_reason: undefined,
        p_reference_number: undefined,
        p_reference_type: null,
        p_user_name: "Test User",
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as never);

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 10,
          movementType: "ADJUSTMENT",
        }),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(401);
      expect(_data).toEqual({ error: "Unauthorized" });
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should return 403 when user is not an admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 10,
          movementType: "ADJUSTMENT",
        }),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(403);
      expect(_data).toEqual({ error: "Only administrators can adjust inventory" });
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should return 404 when organization is not found", async () => {
      mockGetCurrentOrgId.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 10,
          movementType: "ADJUSTMENT",
        }),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(404);
      expect(_data).toEqual({ error: "Organization not found" });
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should return 400 when missing required fields", async () => {
      const testCases = [
        { productId: "prod-1", warehouseId: "wh-1", movementType: "ADJUSTMENT" }, // missing quantity
        { productId: "prod-1", quantity: 10, movementType: "ADJUSTMENT" }, // missing warehouseId
        { warehouseId: "wh-1", quantity: 10, movementType: "ADJUSTMENT" }, // missing productId
        { productId: "prod-1", warehouseId: "wh-1", quantity: 10 }, // missing movementType
      ];

      for (const testCase of testCases) {
        const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
          method: "POST",
          body: JSON.stringify(testCase),
        });

        const response = await POST(request);
        const _data = await response.json();

        expect(response.status).toBe(400);
        expect(_data).toEqual({
          error: "Missing required fields: productId, warehouseId, quantity, movementType",
        });
        expect(mockSupabase.rpc).not.toHaveBeenCalled();
      }
    });

    it("should handle zero quantity adjustment", async () => {
      const requestBody = {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 0,
        movementType: "ADJUSTMENT",
      };

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("adjust_inventory", {
        p_product_id: "prod-1",
        p_warehouse_id: "wh-1",
        p_quantity_change: 0,
        p_movement_type: "ADJUSTMENT",
        p_reason: undefined,
        p_reference_number: undefined,
        p_reference_type: null,
        p_user_name: "Test User",
      });
    });

    it("should handle Supabase RPC errors", async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: "Insufficient inventory" },
      });

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: -100,
          movementType: "DAMAGE",
        }),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(500);
      expect(_data).toEqual({ error: "Insufficient inventory" });
    });

    it("should handle Supabase RPC errors without message", async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { code: "ADJUSTMENT_FAILED" },
      });

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 10,
          movementType: "ADJUSTMENT",
        }),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(500);
      expect(_data).toEqual({ error: "Failed to adjust inventory" });
    });

    it("should handle JSON parsing errors", async () => {
      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(500);
      expect(_data).toEqual({ error: "Internal server error" });
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should use Unknown User when getCurrentUserName fails", async () => {
      mockGetCurrentUserName.mockRejectedValue(new Error("Failed to get user"));

      const requestBody = {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 10,
        movementType: "ADJUSTMENT",
      };

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should handle different movement types", async () => {
      const movementTypes = ["ADJUSTMENT", "DAMAGE", "LOSS", "RETURN", "FOUND"];

      for (const movementType of movementTypes) {
        const requestBody = {
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 5,
          movementType,
        };

        const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          "adjust_inventory",
          expect.objectContaining({
            p_movement_type: movementType,
          })
        );
      }
    });

    it("should handle negative quantities for stock removal", async () => {
      const requestBody = {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: -25,
        movementType: "LOSS",
        reason: "Product lost in shipping",
      };

      const request = new NextRequest("http://localhost:3000/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "adjust_inventory",
        expect.objectContaining({
          p_quantity_change: -25,
          p_movement_type: "LOSS",
          p_reason: "Product lost in shipping",
        })
      );
    });
  });
});
