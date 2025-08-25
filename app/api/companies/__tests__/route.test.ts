import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn()
}));

vi.mock('@/app/utils/roles', () => ({
  getCurrentOrgId: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('@/app/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

describe('Companies API', () => {
  let mockAuth: any;
  let mockCurrentUser: any;
  let mockGetCurrentOrgId: any;
  let mockIsAdmin: any;
  let mockCreateClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mocked functions
    const clerkModule = await import('@clerk/nextjs/server');
    const rolesModule = await import('@/app/utils/roles');
    const supabaseModule = await import('@/app/lib/supabase/server');
    
    mockAuth = vi.mocked(clerkModule.auth);
    mockCurrentUser = vi.mocked(clerkModule.currentUser);
    mockGetCurrentOrgId = vi.mocked(rolesModule.getCurrentOrgId);
    mockIsAdmin = vi.mocked(rolesModule.isAdmin);
    mockCreateClient = vi.mocked(supabaseModule.createClient);
    
    // Default successful auth setup
    mockAuth.mockResolvedValue({ userId: 'user_test123' });
    mockCurrentUser.mockResolvedValue({ 
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User'
    } as any);
    mockGetCurrentOrgId.mockResolvedValue('org_test123');
    mockIsAdmin.mockResolvedValue(true);
  });

  describe('GET /api/companies', () => {
    it('should return companies for authenticated user', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', status: 'active' },
        { id: '2', name: 'Company B', status: 'active' }
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockReturnValue({
                  data: mockCompanies,
                  error: null,
                  count: 2
                })
              })
            })
          })
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockCompanies);
      expect(data.count).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when organization not found', async () => {
      mockGetCurrentOrgId.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/companies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });
  });

  describe('POST /api/companies', () => {
    it('should create a new company', async () => {
      const newCompany = {
        name: 'New Company',
        website: 'www.newcompany.com',
        industry: 'Technology'
      };

      const createdCompany = {
        id: '123',
        ...newCompany,
        organization_clerk_id: 'org_test123',
        created_by_clerk_user_id: 'user_test123',
        created_by_name: 'Test User',
        status: 'active'
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: createdCompany,
                error: null
              })
            })
          })
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(newCompany)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdCompany);
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
    });

    it('should return 403 when user is not admin', async () => {
      mockIsAdmin.mockResolvedValue(false);

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

    it('should handle database errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Company' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create company');
    });

    it('should create company with primary contact', async () => {
      const requestBody = {
        name: 'Company with Contact',
        primaryContact: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      };

      const createdCompany = {
        id: '123',
        name: requestBody.name,
        organization_clerk_id: 'org_test123',
        status: 'active'
      };

      const createdContact = {
        id: '456',
        company_id: '123',
        ...requestBody.primaryContact,
        is_primary: true
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockReturnValue({
                    data: createdCompany,
                    error: null
                  })
                })
              })
            };
          }
          if (table === 'contacts') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockReturnValue({
                    data: createdContact,
                    error: null
                  })
                })
              })
            };
          }
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('123');
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
      expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    });
  });
});