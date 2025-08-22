import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn(),
  }),
}));

// Mock Supabase
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

import { useAuth } from "@clerk/nextjs";
import { createBrowserClient } from "@supabase/ssr";

import { useSupabase } from "../use-supabase";

describe("useSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("should create a Supabase client with correct configuration", () => {
    const mockClient = { from: vi.fn() };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as never);

    const { result } = renderHook(() => useSupabase());

    expect(createBrowserClient).toHaveBeenCalledWith(
      "http://localhost:54321",
      "test-anon-key",
      expect.objectContaining({
        global: expect.objectContaining({
          fetch: expect.any(Function),
        }),
      })
    );

    expect(result.current).toBe(mockClient);
  });

  it.skip("should use memoization to prevent unnecessary re-renders", () => {
    const mockClient = { from: vi.fn() };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as never);

    const { result, rerender } = renderHook(() => useSupabase());
    const firstResult = result.current;

    // Rerender should return the same client
    rerender();
    expect(result.current).toBe(firstResult);

    // Should only call createBrowserClient once
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });

  it.skip("should handle custom fetch with authorization token", async () => {
    const mockToken = "test-token-123";
    const mockAuth = vi.mocked(useAuth());
    mockAuth.getToken.mockResolvedValue(mockToken);

    const mockClient = { from: vi.fn() };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as never);

    renderHook(() => useSupabase());

    // Get the fetch function that was passed to createBrowserClient
    const clientConfig = vi.mocked(createBrowserClient).mock.calls[0]?.[2];
    const customFetch = clientConfig?.global?.fetch;

    // Mock the global fetch
    const mockGlobalFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockGlobalFetch;

    // Test the custom fetch
    await customFetch?.("https://api.example.com", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    expect(mockAuth.getToken).toHaveBeenCalledWith({ template: "supabase" });
    expect(mockGlobalFetch).toHaveBeenCalledWith("https://api.example.com", {
      method: "GET",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      }),
    });
  });

  it.skip("should handle custom fetch without authorization token", async () => {
    const mockAuth = vi.mocked(useAuth());
    mockAuth.getToken.mockResolvedValue(null);

    const mockClient = { from: vi.fn() };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as never);

    renderHook(() => useSupabase());

    // Get the fetch function that was passed to createBrowserClient
    const clientConfig = vi.mocked(createBrowserClient).mock.calls[0]?.[2];
    const customFetch = clientConfig?.global?.fetch;

    // Mock the global fetch
    const mockGlobalFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockGlobalFetch;

    // Test the custom fetch without token
    await customFetch?.("https://api.example.com", {
      method: "GET",
    });

    expect(mockAuth.getToken).toHaveBeenCalledWith({ template: "supabase" });
    expect(mockGlobalFetch).toHaveBeenCalledWith("https://api.example.com", {
      method: "GET",
      headers: expect.not.objectContaining({
        Authorization: expect.any(String),
      }),
    });
  });

  it.skip("should handle custom fetch with no options parameter", async () => {
    const mockToken = "test-token-456";
    const mockAuth = vi.mocked(useAuth());
    mockAuth.getToken.mockResolvedValue(mockToken);

    const mockClient = { from: vi.fn() };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as never);

    renderHook(() => useSupabase());

    // Get the fetch function that was passed to createBrowserClient
    const clientConfig = vi.mocked(createBrowserClient).mock.calls[0]?.[2];
    const customFetch = clientConfig?.global?.fetch;

    // Mock the global fetch
    const mockGlobalFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockGlobalFetch;

    // Test the custom fetch with no options
    await customFetch?.("https://api.example.com");

    expect(mockGlobalFetch).toHaveBeenCalledWith("https://api.example.com", {
      headers: expect.objectContaining({
        Authorization: "Bearer test-token-456",
      }),
    });
  });
});
