import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'user_test123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  emailAddresses: [{ emailAddress: 'test@example.com' }]
};

export const mockOrgId = 'org_test123';

// Mock Supabase responses
export const mockCompanies = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Corporation',
    website: 'www.acme.com',
    industry: 'Technology',
    company_size: '51-200',
    status: 'active',
    organization_clerk_id: mockOrgId,
    created_by_clerk_user_id: mockUser.id,
    created_by_name: mockUser.fullName,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Global Industries Inc.',
    website: 'www.global.com',
    industry: 'Manufacturing',
    company_size: '1000+',
    status: 'active',
    organization_clerk_id: mockOrgId,
    created_by_clerk_user_id: mockUser.id,
    created_by_name: mockUser.fullName,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

export const mockContacts = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    company_id: mockCompanies[0].id,
    first_name: 'Robert',
    last_name: 'Smith',
    email: 'robert.smith@acme.com',
    phone: '555-1234',
    is_primary: true,
    status: 'active',
    organization_clerk_id: mockOrgId,
    created_by_clerk_user_id: mockUser.id,
    created_by_name: mockUser.fullName
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    company_id: mockCompanies[0].id,
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@acme.com',
    phone: '555-5678',
    is_primary: false,
    status: 'active',
    organization_clerk_id: mockOrgId,
    created_by_clerk_user_id: mockUser.id,
    created_by_name: mockUser.fullName
  }
];

// Create mock Supabase client
export function createMockSupabaseClient(overrides: any = {}) {
  const defaultMocks = {
    companies: {
      select: mockCompanies,
      insert: { ...mockCompanies[0], id: '00000000-0000-0000-0000-000000000003' },
      update: mockCompanies[0],
      delete: null
    },
    contacts: {
      select: mockContacts,
      insert: { ...mockContacts[0], id: '10000000-0000-0000-0000-000000000003' },
      update: mockContacts[0],
      delete: null
    },
    ...overrides
  };

  return {
    from: vi.fn((table: string) => {
      const tableMocks = defaultMocks[table] || {};
      
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: tableMocks.select || [],
              error: null
            })),
            single: vi.fn(() => ({
              data: tableMocks.select?.[0] || null,
              error: null
            }))
          })),
          order: vi.fn(() => ({
            data: tableMocks.select || [],
            error: null
          })),
          single: vi.fn(() => ({
            data: tableMocks.select?.[0] || null,
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: tableMocks.insert || null,
              error: null
            }))
          })),
          single: vi.fn(() => ({
            data: tableMocks.insert || null,
            error: null
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: tableMocks.update || null,
                  error: null
                }))
              }))
            }))
          })),
          match: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: tableMocks.update || null,
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: tableMocks.delete || null,
              error: null
            }))
          })),
          match: vi.fn(() => ({
            data: tableMocks.delete || null,
            error: null
          }))
        }))
      };
    }),
    rpc: vi.fn(() => ({
      data: null,
      error: null
    }))
  };
}

// Setup all required mocks
export function setupMocks() {
  // Mock Clerk
  vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(() => Promise.resolve({ userId: mockUser.id })),
    currentUser: vi.fn(() => Promise.resolve(mockUser))
  }));

  // Mock role utilities
  vi.mock('@/app/utils/roles', () => ({
    getCurrentOrgId: vi.fn(() => Promise.resolve(mockOrgId)),
    isAdmin: vi.fn(() => Promise.resolve(true))
  }));

  // Mock Supabase
  vi.mock('@/app/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(createMockSupabaseClient()))
  }));
}