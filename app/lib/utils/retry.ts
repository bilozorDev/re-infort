/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Default retry options
 */
const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    const err = error as Record<string, unknown>;
    if (err?.message && typeof err.message === "string") {
      if (err.message.includes("fetch failed")) return true;
      if (err.message.includes("NetworkError")) return true;
    }
    if (typeof err?.status === "number" && err.status >= 500 && err.status < 600) return true;
    if (err?.code === "ECONNRESET") return true;
    if (err?.code === "ETIMEDOUT") return true;
    return false;
  },
  onRetry: () => {},
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  // Exponential backoff with jitter
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (±25% of the delay)
  const jitter = clampedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, clampedDelay + jitter);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.retryCondition(error)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Call onRetry callback
      opts.onRetry(error, attempt);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry decorator for class methods
 */
export function RetryableMethod(options?: RetryOptions) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Create a retryable fetch wrapper
 */
export function createRetryableFetch(options?: RetryOptions) {
  return async function retryableFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    return retry(async () => {
      const response = await fetch(input, init);
      
      // Throw error for server errors to trigger retry
      if (response.status >= 500) {
        const error = new Error(`Server error: ${response.status}`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      
      return response;
    }, options);
  };
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: "closed" | "open" | "half-open" = "closed";
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === "open") {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await retry(fn, {
        ...options,
        onRetry: (error, attempt) => {
          this.recordFailure();
          options?.onRetry?.(error, attempt);
        },
      });
      
      // Success - reset if in half-open state
      if (this.state === "half-open") {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = "open";
      console.warn(`Circuit breaker opened after ${this.failureCount} failures`);
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.state = "half-open";
        console.info("Circuit breaker entering half-open state");
      }, this.resetTimeout);
    }
  }

  private reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "closed";
    console.info("Circuit breaker reset");
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Batch retry for multiple operations
 */
export async function batchRetry<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options?: RetryOptions & { concurrency?: number }
): Promise<Array<{ item: T; result?: R; error?: unknown }>> {
  const concurrency = options?.concurrency || 5;
  const results: Array<{ item: T; result?: R; error?: unknown }> = [];
  
  // Process in chunks
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map(item =>
        retry(() => operation(item), options).then(
          result => ({ item, result }),
          error => ({ item, error })
        )
      )
    );
    
    chunkResults.forEach(result => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    });
  }
  
  return results;
}

/**
 * Create a retryable API client
 */
export function createRetryableApiClient(baseUrl: string, defaultOptions?: RetryOptions) {
  const circuitBreaker = new CircuitBreaker();
  
  return {
    async get(path: string, options?: RequestInit): Promise<Response> {
      return circuitBreaker.execute(
        () => fetch(`${baseUrl}${path}`, { ...options, method: "GET" }),
        defaultOptions
      );
    },
    
    async post(path: string, body?: unknown, options?: RequestInit): Promise<Response> {
      return circuitBreaker.execute(
        () => fetch(`${baseUrl}${path}`, {
          ...options,
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
        }),
        defaultOptions
      );
    },
    
    async put(path: string, body?: unknown, options?: RequestInit): Promise<Response> {
      return circuitBreaker.execute(
        () => fetch(`${baseUrl}${path}`, {
          ...options,
          method: "PUT",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
        }),
        defaultOptions
      );
    },
    
    async delete(path: string, options?: RequestInit): Promise<Response> {
      return circuitBreaker.execute(
        () => fetch(`${baseUrl}${path}`, { ...options, method: "DELETE" }),
        defaultOptions
      );
    },
    
    getCircuitBreakerState() {
      return circuitBreaker.getState();
    },
  };
}