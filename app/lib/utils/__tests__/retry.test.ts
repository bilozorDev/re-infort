import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRetry,
  CircuitBreaker,
  createRetryableApiClient,
  createRetryableFetch,
  retry,
} from "../retry";

describe("Retry Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("retry", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      const result = await retry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");

      const retryPromise = retry(mockFn, {
        maxAttempts: 3,
        initialDelay: 100,
        retryCondition: () => true,
      });

      // Advance time for all retries
      await vi.advanceTimersByTimeAsync(500);

      const result = await retryPromise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max attempts", async () => {
      const error = new Error("Persistent error");
      const mockFn = vi.fn().mockRejectedValue(error);

      const retryPromise = retry(mockFn, {
        maxAttempts: 2,
        initialDelay: 100,
        retryCondition: () => true,
      });

      // Advance time for all retries
      await vi.advanceTimersByTimeAsync(300);

      await expect(retryPromise).rejects.toThrow("Persistent error");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should not retry when retry condition returns false", async () => {
      const error = new Error("Non-retryable error");
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(
        retry(mockFn, {
          maxAttempts: 3,
          retryCondition: () => false,
        })
      ).rejects.toThrow("Non-retryable error");

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should use default retry condition for network errors", async () => {
      const networkError = new Error("fetch failed");
      const mockFn = vi.fn().mockRejectedValue(networkError);

      const retryPromise = retry(mockFn, { maxAttempts: 2, initialDelay: 100 });

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toThrow("fetch failed");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should not retry for client errors by default", async () => {
      const clientError = { status: 400, message: "Bad request" };
      const mockFn = vi.fn().mockRejectedValue(clientError);

      await expect(retry(mockFn)).rejects.toEqual(clientError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry for server errors by default", async () => {
      const serverError = { status: 500, message: "Internal server error" };
      const mockFn = vi.fn().mockRejectedValue(serverError);

      const retryPromise = retry(mockFn, { maxAttempts: 2, initialDelay: 100 });

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toEqual(serverError);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should call onRetry callback", async () => {
      const error = new Error("Test error");
      const mockFn = vi.fn().mockRejectedValue(error);
      const onRetry = vi.fn();

      const retryPromise = retry(mockFn, {
        maxAttempts: 2,
        initialDelay: 100,
        retryCondition: () => true,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toThrow("Test error");
      expect(onRetry).toHaveBeenCalledWith(error, 1);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should handle ECONNRESET errors", async () => {
      const connectionError = { code: "ECONNRESET" };
      const mockFn = vi.fn().mockRejectedValue(connectionError);

      const retryPromise = retry(mockFn, { maxAttempts: 2, initialDelay: 100 });

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toEqual(connectionError);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should handle ETIMEDOUT errors", async () => {
      const timeoutError = { code: "ETIMEDOUT" };
      const mockFn = vi.fn().mockRejectedValue(timeoutError);

      const retryPromise = retry(mockFn, { maxAttempts: 2, initialDelay: 100 });

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toEqual(timeoutError);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff", async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));

      const retryPromise = retry(mockFn, {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        retryCondition: () => true,
      });

      // Allow for execution and retries
      await vi.advanceTimersByTimeAsync(500);

      await expect(retryPromise).rejects.toThrow("Test error");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should respect max delay", async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));

      const retryPromise = retry(mockFn, {
        maxAttempts: 4,
        initialDelay: 100,
        maxDelay: 150,
        backoffMultiplier: 3,
        retryCondition: () => true,
      });

      // Allow for all retries
      await vi.advanceTimersByTimeAsync(1000);

      await expect(retryPromise).rejects.toThrow("Test error");
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe("createRetryableFetch", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it("should not retry on client errors", async () => {
      mockFetch.mockResolvedValue({ status: 404 });

      const retryableFetch = createRetryableFetch();

      const response = await retryableFetch("https://api.example.com/data");

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw custom error for server errors", async () => {
      mockFetch.mockResolvedValue({ status: 500 });

      const retryableFetch = createRetryableFetch({
        maxAttempts: 2,
        initialDelay: 100,
      });

      const retryPromise = retryableFetch("https://api.example.com/data");

      await vi.advanceTimersByTimeAsync(200);

      await expect(retryPromise).rejects.toThrow("Server error: 500");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should pass request options to fetch", async () => {
      mockFetch.mockResolvedValue({ status: 200 });

      const retryableFetch = createRetryableFetch();

      await retryableFetch("https://api.example.com/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  describe("CircuitBreaker", () => {
    it("should execute function normally when circuit is closed", async () => {
      const circuitBreaker = new CircuitBreaker(3, 1000, 500);
      const mockFn = vi.fn().mockResolvedValue("success");

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should open circuit after threshold failures", async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000, 500);
      const error = new Error("Service error");
      const mockFn = vi.fn().mockRejectedValue(error);

      // First two failures should work
      await expect(circuitBreaker.execute(mockFn, { maxAttempts: 1 })).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn, { maxAttempts: 1 })).rejects.toThrow();

      // Third call should fail immediately due to open circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow("Circuit breaker is open");

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should transition to half-open after timeout", async () => {
      const circuitBreaker = new CircuitBreaker(1, 1000, 500);
      const error = new Error("Service error");
      const mockFn = vi.fn().mockRejectedValue(error);

      // Cause circuit to open
      await expect(circuitBreaker.execute(mockFn, { maxAttempts: 1 })).rejects.toThrow();

      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(1100);

      // Should attempt to execute (half-open state)
      await expect(circuitBreaker.execute(mockFn, { maxAttempts: 1 })).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should reset circuit on successful execution in half-open state", async () => {
      const circuitBreaker = new CircuitBreaker(1, 1000, 500);
      const mockFn = vi.fn();

      // Cause circuit to open
      mockFn.mockRejectedValueOnce(new Error("Service error"));
      await expect(circuitBreaker.execute(mockFn, { maxAttempts: 1 })).rejects.toThrow();

      // Advance time to half-open
      await vi.advanceTimersByTimeAsync(1100);

      // Succeed in half-open state
      mockFn.mockResolvedValue("success");
      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe("success");
      expect(circuitBreaker.getState().state).toBe("closed");
    });

    it("should provide circuit breaker state", () => {
      const circuitBreaker = new CircuitBreaker(3, 1000, 500);
      const state = circuitBreaker.getState();

      expect(state.state).toBe("closed");
      expect(state.failureCount).toBe(0);
      expect(state.lastFailureTime).toBeNull();
    });
  });

  describe("batchRetry", () => {
    it("should process all items successfully", async () => {
      const items = [1, 2, 3];
      const operation = vi.fn().mockResolvedValue("success");

      const results = await batchRetry(items, operation, {
        maxAttempts: 2,
        initialDelay: 100,
        concurrency: 2,
      });

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.result === "success")).toBe(true);
      expect(results.every((r) => r.error === undefined)).toBe(true);
    });

    it("should handle mixed success and failure", async () => {
      const items = [1, 2];
      const operation = vi
        .fn()
        .mockResolvedValueOnce("success")
        .mockRejectedValue(new Error("Persistent failure"));

      const retryPromise = batchRetry(items, operation, {
        maxAttempts: 2,
        initialDelay: 100,
        concurrency: 1,
      });

      await vi.advanceTimersByTimeAsync(200);

      const results = await retryPromise;

      expect(results).toHaveLength(2);
      expect(results[0].result).toBe("success");
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeInstanceOf(Error);
      expect(results[1].result).toBeUndefined();
    });

    it("should respect concurrency limits", async () => {
      const items = [1, 2, 3, 4, 5];
      const operation = vi.fn().mockResolvedValue("success");

      await batchRetry(items, operation, { concurrency: 2 });

      // Should process in 3 chunks: [1,2], [3,4], [5]
      expect(operation).toHaveBeenCalledTimes(5);
    });
  });

  describe("createRetryableApiClient", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it("should create API client with retry functionality", async () => {
      mockFetch.mockResolvedValue({ status: 200, json: () => ({ data: "success" }) });

      const client = createRetryableApiClient("https://api.example.com");

      const response = await client.get("/users");

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users", { method: "GET" });
    });

    it("should handle POST requests with body", async () => {
      mockFetch.mockResolvedValue({ status: 201 });

      const client = createRetryableApiClient("https://api.example.com");

      const response = await client.post("/users", { name: "John" });

      expect(response.status).toBe(201);
      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users", {
        method: "POST",
        body: JSON.stringify({ name: "John" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should handle PUT requests", async () => {
      mockFetch.mockResolvedValue({ status: 200 });

      const client = createRetryableApiClient("https://api.example.com");

      await client.put("/users/1", { name: "Jane" });

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users/1", {
        method: "PUT",
        body: JSON.stringify({ name: "Jane" }),
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should handle DELETE requests", async () => {
      mockFetch.mockResolvedValue({ status: 204 });

      const client = createRetryableApiClient("https://api.example.com");

      await client.delete("/users/1");

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users/1", {
        method: "DELETE",
      });
    });

    it("should provide circuit breaker state", () => {
      const client = createRetryableApiClient("https://api.example.com");

      const state = client.getCircuitBreakerState();

      expect(state.state).toBe("closed");
    });

    it("should handle custom headers", async () => {
      mockFetch.mockResolvedValue({ status: 200 });

      const client = createRetryableApiClient("https://api.example.com");

      await client.post(
        "/users",
        { name: "John" },
        {
          headers: { Authorization: "Bearer token" },
        }
      );

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users", {
        method: "POST",
        body: JSON.stringify({ name: "John" }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
      });
    });
  });
});
