import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/app/lib/supabase/server";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";
import { createMockService,mockServices } from "@/test/fixtures/quotes";

import { GET, POST } from "../route";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/utils/user");
vi.mock("@/app/lib/supabase/server");

describe("Services API Route", () => {
  const mockSupabase: any = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe("GET /api/services", () => {
    function createGetRequest() {
      return new NextRequest("http://localhost:3000/api/services");
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return services successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a thenable mock that resolves to the data
      const thenableMock = {
        ...mockSupabase,
        then: (resolve: any) => resolve({
          data: mockServices,
          error: null,
        })
      };
      
      // Mock the complete chain: from -> select -> eq -> order -> eq (returns thenable)
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(thenableMock);
      mockSupabase.order.mockReturnValue(mockSupabase);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: mockServices, categories: ["Professional Services", "Development"] });
      expect(mockSupabase.from).toHaveBeenCalledWith("services");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("organization_clerk_id", "org_test123");
      expect(mockSupabase.order).toHaveBeenCalledWith("name", { ascending: true });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a thenable mock that resolves to an error
      const errorMock = {
        ...mockSupabase,
        then: (resolve: any) => resolve({
          data: null,
          error: { message: "Database error" },
        })
      };
      
      // Mock the chain but return error at the end
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(errorMock);
      mockSupabase.order.mockReturnValue(mockSupabase);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch services" });
    });
  });

  describe("POST /api/services", () => {
    const validServiceData = {
      name: "New Service",
      description: "New service description",
      category: "New Category",
      rate_type: "hourly",
      rate: 200.00,
      unit: "per hour",
      status: "active",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPostRequest(validServiceData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123", false));
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createPostRequest(validServiceData);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can create services" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123", true));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validServiceData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should validate negative rate", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123", true));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");

      const request = createPostRequest({
        ...validServiceData,
        rate: -100,
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Rate must be a positive number" });
    });

    it("should allow null rate", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123", true));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      const mockService = createMockService({ ...validServiceData, rate: null });
      mockSupabase.single.mockResolvedValue({
        data: mockService,
        error: null,
      });

      const request = createPostRequest({
        ...validServiceData,
        rate: null,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("should create service successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_admin", "org_test123", true));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      const mockService = createMockService(validServiceData);
      mockSupabase.single.mockResolvedValue({
        data: mockService,
        error: null,
      });

      const request = createPostRequest(validServiceData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockService);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...validServiceData,
        organization_clerk_id: "org_test123",
        created_by_clerk_user_id: "user_admin",
        created_by_name: "Test User",
      });
    });

    it("should handle database insert errors", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_admin", "org_test123", true));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      const request = createPostRequest(validServiceData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to create service" });
    });
  });
});