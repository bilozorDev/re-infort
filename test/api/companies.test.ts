import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/companies/route';
import { createClient } from '@/app/lib/supabase/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'user_test123' })),
  currentUser: vi.fn(() => Promise.resolve({ 
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User'
  }))
}));

// Mock Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(),
    rpc: vi.fn()
  }))
}));

// Mock role utilities
vi.mock('@/app/utils/roles', () => ({
  getCurrentOrgId: vi.fn(() => Promise.resolve('org_test123')),
  isAdmin: vi.fn(() => Promise.resolve(true))
}));

describe('/api/companies', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [
                {
                  id: '00000000-0000-0000-0000-000000000001',
                  name: 'Acme Corporation',
                  industry: 'Technology',
                  status: 'active',
                  created_at: '2024-01-01T00:00:00Z'
                },
                {
                  id: '00000000-0000-0000-0000-000000000002',
                  name: 'Global Industries Inc.',
                  industry: 'Manufacturing',
                  status: 'active',
                  created_at: '2024-01-02T00:00:00Z'
                }
              ],
              error: null
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'New Company',
                organization_clerk_id: 'org_test123',
                status: 'active'
              },
              error: null
            }))
          }))
        }))
      })),
      rpc: vi.fn()
    };

    (createClient as any).mockImplementation(() => Promise.resolve(mockSupabase));
  });

  describe('GET /api/companies', () => {
    it('should return list of companies for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Acme Corporation');
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
    });

    it('should return 401 when user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when organization is not found', async () => {
      const { getCurrentOrgId } = await import('@/app/utils/roles');
      (getCurrentOrgId as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });
  });

  describe('POST /api/companies', () => {
    it('should create a new company with primary contact', async () => {
      const requestBody = {
        name: 'New Company',
        website: 'www.newcompany.com',
        industry: 'Technology',
        primaryContact: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@newcompany.com',
          phone: '555-1234'
        }
      };

      // Mock contact insertion
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: '00000000-0000-0000-0000-000000000003',
                    name: 'New Company',
                    organization_clerk_id: 'org_test123',
                    status: 'active'
                  },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'contacts') {
          return {
            insert: vi.fn(() => ({
              data: {
                id: '10000000-0000-0000-0000-000000000020',
                company_id: '00000000-0000-0000-0000-000000000003',
                first_name: 'John',
                last_name: 'Doe',
                is_primary: true
              },
              error: null
            }))
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Company');
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
      expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    });

    it('should return 403 when user is not admin', async () => {
      const { isAdmin } = await import('@/app/utils/roles');
      (isAdmin as any).mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Company' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only administrators can create companies');
    });

    it('should return 400 when company name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({ website: 'www.test.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Company name is required');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }));

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Company' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create company');
    });
  });
});