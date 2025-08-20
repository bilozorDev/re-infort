import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, vi } from 'vitest'

// Create a query client factory for tests
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Turn off retries to make tests faster and more predictable
        retry: false,
        // Set stale time to 0 to always fetch fresh data in tests
        staleTime: 0,
        // Disable automatic refetching
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        // Turn off retries for mutations
        retry: false,
      },
    },
  })
}

// Props for the test wrapper
interface TestWrapperProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

// Create a wrapper component for tests
export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Create a wrapper factory for renderHook
export const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient()
  
  return ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={client}>{children}</TestWrapper>
  )
}

// Helper to wait for queries to settle
export const waitForQueries = async (queryClient: QueryClient) => {
  await queryClient.getQueryCache().findAll({ type: 'active' })
    .map(query => query.fetch())
    .filter(Boolean)
    .reduce(async (promise, next) => {
      await promise
      await next
    }, Promise.resolve())
}

// Helper to flush all pending promises
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create a mock mutation function
export const createMockMutation = <TData = any, TError = any, TVariables = any, TContext = any>() => {
  const mockFn = vi.fn()
  
  // Default to successful resolution
  mockFn.mockResolvedValue({} as TData)
  
  return {
    mutationFn: mockFn,
    mockSuccess: (data: TData) => mockFn.mockResolvedValue(data),
    mockError: (error: TError) => mockFn.mockRejectedValue(error),
    expectToBeCalled: () => expect(mockFn).toHaveBeenCalled(),
    expectToBeCalledWith: (variables: TVariables) => expect(mockFn).toHaveBeenCalledWith(variables),
    expectToBeCalledTimes: (times: number) => expect(mockFn).toHaveBeenCalledTimes(times),
    reset: () => mockFn.mockReset(),
  }
}

// Helper to create a mock query function
export const createMockQuery = <TData = any>() => {
  const mockFn = vi.fn()
  
  // Default to successful resolution
  mockFn.mockResolvedValue({} as TData)
  
  return {
    queryFn: mockFn,
    mockSuccess: (data: TData) => mockFn.mockResolvedValue(data),
    mockError: (error: any) => mockFn.mockRejectedValue(error),
    expectToBeCalled: () => expect(mockFn).toHaveBeenCalled(),
    expectToBeCalledTimes: (times: number) => expect(mockFn).toHaveBeenCalledTimes(times),
    reset: () => mockFn.mockReset(),
  }
}