import { vi } from 'vitest'

// Mock data for testing
export const mockUser = {
  id: 'user_test123',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
}

// Create chainable mock query builder
export const createQueryBuilderMock = (data: any = null, error: any = null) => {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: vi.fn((callback) => callback({ data, error })),
  }

  // Make the mock thenable so it can be awaited
  mock.then = vi.fn((callback) => {
    return Promise.resolve({ data, error }).then(callback)
  })

  return mock
}

// Create Supabase client mock
export const createClientMock = () => {
  const fromMock = vi.fn((table: string) => {
    return createQueryBuilderMock()
  })

  const authMock = {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    }),
    signIn: vi.fn().mockResolvedValue({ 
      data: mockSession, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ 
      error: null 
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  }

  const rpcMock = vi.fn().mockResolvedValue({ 
    data: null, 
    error: null 
  })

  const storageMock = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
    })),
  }

  return {
    from: fromMock,
    auth: authMock,
    rpc: rpcMock,
    storage: storageMock,
  }
}

// Export a default mock client instance
export const supabaseMock = createClientMock()

// Mock the createClient function
export const mockCreateClient = vi.fn(() => supabaseMock)

// Set up module mocks
vi.mock('@/app/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/app/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks()
}

// Helper to set up specific mock responses
export const setSupabaseMockData = (table: string, data: any, error: any = null) => {
  const queryBuilder = createQueryBuilderMock(data, error)
  supabaseMock.from.mockImplementation((t: string) => {
    if (t === table) {
      return queryBuilder
    }
    return createQueryBuilderMock()
  })
  return queryBuilder
}

// Helper to set up RPC mock responses
export const setSupabaseRpcMockData = (data: any, error: any = null) => {
  supabaseMock.rpc.mockResolvedValue({ data, error })
}

// Helper to set up auth mock responses
export const setSupabaseAuthMock = (user: any = mockUser, session: any = mockSession) => {
  supabaseMock.auth.getUser.mockResolvedValue({ 
    data: { user }, 
    error: null 
  })
  supabaseMock.auth.getSession.mockResolvedValue({ 
    data: { session }, 
    error: null 
  })
}