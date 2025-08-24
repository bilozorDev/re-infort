import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/app/lib/supabase/server";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import { getCurrentOrgId } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";
import { mockClients, createMockClient } from "@/test/fixtures/quotes";

import { GET, POST } from "../route";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/utils/user");
vi.mock("@/app/lib/supabase/server");

describe("Clients API Route", () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    ilike: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    range: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe("GET /api/clients", () => {
    function createGetRequest() {
      return new NextRequest("http://localhost:3000/api/clients");
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

    it("should return clients successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a final mock that resolves to data when awaited
      const finalPromise = Promise.resolve({
        data: mockClients,
        error: null,
        count: null
      });
      
      // Mock the complete chain: from -> select -> eq -> order -> range
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(finalPromise);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ 
        data: mockClients, 
        count: null,
        limit: 50,
        offset: 0
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("clients");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("organization_clerk_id", "org_test123");
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a final mock that resolves to error when awaited
      const errorPromise = Promise.resolve({
        data: null,
        error: { message: "Database error" },
        count: null
      });
      
      // Mock the chain but return error at the end
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(errorPromise);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch clients" });
    });
  });

  describe("POST /api/clients", () => {
    const validClientData = {
      name: "New Client",
      email: "newclient@example.com",
      phone: "+1-555-9999",
      company: "New Company",
      address: "999 New St",
      city: "New City",
      state_province: "NC",
      postal_code: "99999",
      country: "USA",
      notes: "New client notes",
      tags: ["new", "prospect"],
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPostRequest(validClientData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validClientData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should validate email format", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");

      const request = createPostRequest({
        ...validClientData,
        email: "invalid-email",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Invalid email format" });
    });

    it("should allow empty email", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      const mockClient = createMockClient({ ...validClientData, email: null });
      mockSupabase.single.mockResolvedValue({
        data: mockClient,
        error: null,
      });

      const request = createPostRequest({
        ...validClientData,
        email: "",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("should check for duplicate emails", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Simulate database constraint violation for duplicate email
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { 
          code: "23505", 
          message: "duplicate key value violates unique constraint unique_client_email_per_org"
        },
      });

      const request = createPostRequest(validClientData);
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toEqual({ error: "A client with this email already exists in your organization" });
    });

    it("should create client successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Mock successful insert
      const mockClient = createMockClient(validClientData);
      mockSupabase.single.mockResolvedValue({
        data: mockClient,
        error: null,
      });

      const request = createPostRequest(validClientData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockClient);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...validClientData,
        organization_clerk_id: "org_test123",
        created_by_clerk_user_id: "user_test",
        created_by_name: "Test User",
      });
    });

    it("should handle database insert errors", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Mock insert error
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      const request = createPostRequest(validClientData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to create client" });
    });
  });
});