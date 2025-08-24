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
import { mockQuotes, createMockQuote, mockQuoteItems } from "@/test/fixtures/quotes";

import { GET, POST } from "../route";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/supabase/server");
vi.mock("@/app/utils/user");

describe("Quotes API Route", () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    range: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    rpc: vi.fn(() => mockSupabase),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe("GET /api/quotes", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new NextRequest("http://localhost:3000/api/quotes");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/quotes");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return all quotes when no status filter", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a final mock that resolves to data when awaited
      const finalPromise = Promise.resolve({
        data: mockQuotes,
        error: null,
      });
      
      // Mock the complete chain: from -> select -> eq -> order -> range
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(finalPromise);

      const request = new NextRequest("http://localhost:3000/api/quotes");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: mockQuotes, limit: 50, offset: 0 });
      expect(mockSupabase.from).toHaveBeenCalledWith("quotes");
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        client:clients(id, name, email, company),
        items:quote_items(*)
      `);
      expect(mockSupabase.eq).toHaveBeenCalledWith("organization_clerk_id", "org_test123");
    });

    it("should filter quotes by status", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      const sentQuotes = mockQuotes.filter(q => q.status === "sent");
      
      // Create a final mock that resolves to data when awaited
      const finalPromise = Promise.resolve({
        data: sentQuotes,
        error: null,
      });
      
      // Mock the complete chain: from -> select -> eq -> order -> range (creates query), then eq (status filter)
      const baseQuery = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(finalPromise)
      };
      
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(baseQuery);

      const request = new NextRequest("http://localhost:3000/api/quotes?status=sent");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: sentQuotes, limit: 50, offset: 0 });
      expect(baseQuery.eq).toHaveBeenCalledWith("status", "sent");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Create a final mock that resolves to error when awaited
      const errorPromise = Promise.resolve({
        data: null,
        error: { message: "Database error" },
      });
      
      // Mock the chain but return error at the end
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(errorPromise);

      const request = new NextRequest("http://localhost:3000/api/quotes");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch quotes" });
    });
  });

  describe("POST /api/quotes", () => {
    const validQuoteData = {
      client_id: "client-1",
      status: "draft",
      valid_from: "2024-01-01",
      valid_until: "2024-01-31",
      discount_type: "percentage",
      discount_value: 10,
      tax_rate: 8.5,
      terms_and_conditions: "Standard terms",
      notes: "Quote notes",
      internal_notes: "Internal notes",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPostRequest(validQuoteData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validQuoteData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should validate required fields", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");

      const request = createPostRequest({
        ...validQuoteData,
        client_id: null,
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Client is required" });
    });

    it("should set default dates when not provided", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock quote number generation
      mockSupabase.rpc.mockResolvedValue({
        data: "QT-2024-003",
        error: null,
      });
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Mock quote creation
      const mockQuote = createMockQuote({
        ...validQuoteData,
        quote_number: "QT-2024-003",
      });
      mockSupabase.single.mockResolvedValue({
        data: mockQuote,
        error: null,
      });

      const request = createPostRequest({
        ...validQuoteData,
        valid_from: undefined,
        valid_until: undefined,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      // Should set defaults for valid_from and valid_until
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          valid_from: expect.any(String),
          valid_until: expect.any(String),
        })
      );
    });

    it("should generate quote number and create quote successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_test", "org_test123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      // Mock quote number generation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: "QT-2024-003",
        error: null,
      });
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Mock quote creation
      const mockQuote = createMockQuote({
        ...validQuoteData,
        quote_number: "QT-2024-003",
      });
      mockSupabase.single.mockResolvedValue({
        data: mockQuote,
        error: null,
      });

      const request = createPostRequest(validQuoteData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockQuote);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("generate_quote_number", {
        p_org_id: "org_test123",
      });
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...validQuoteData,
        quote_number: "QT-2024-003",
        organization_clerk_id: "org_test123",
        created_by_clerk_user_id: "user_test",
        created_by_name: "Test User",
        assigned_to_clerk_user_id: "user_test",
        assigned_to_name: "Test User",
      });
    });

    it("should handle quote number generation error", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Failed to generate quote number" },
      });

      const request = createPostRequest(validQuoteData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to generate quote number" });
    });

    it("should handle database insert errors", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      vi.mocked(getCurrentUserName).mockResolvedValue("Test User");
      
      mockSupabase.rpc.mockResolvedValue({
        data: "QT-2024-003",
        error: null,
      });
      
      // Mock the insert chain: from -> insert -> select -> single
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      const request = createPostRequest(validQuoteData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to create quote" });
    });
  });
});