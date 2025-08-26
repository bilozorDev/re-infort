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

describe('Company Contacts API', () => {
  let mockAuth: any;
  let mockCurrentUser: any;
  let mockGetCurrentOrgId: any;
  let mockIsAdmin: any;
  let mockCreateClient: any;

  const companyId = '00000000-0000-0000-0000-000000000001';

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

  describe('GET /api/companies/[id]/contacts', () => {
    it('should return contacts for a company', async () => {
      const mockContacts = [
        { 
          id: '1', 
          company_id: companyId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          is_primary: true 
        },
        { 
          id: '2', 
          company_id: companyId,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          is_primary: false 
        }
      ];

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockReturnValue({
                      data: { id: companyId, name: 'Test Company' },
                      error: null
                    })
                  })
                })
              })
            };
          }
          if (table === 'contacts') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        data: mockContacts,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockContacts);
      expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    });

    it('should handle database errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          })
        })
      };

      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch contacts');
    });
  });

  describe('POST /api/companies/[id]/contacts', () => {
    it('should create a new contact', async () => {
      const newContact = {
        first_name: 'New',
        last_name: 'Contact',
        email: 'new@example.com',
        phone: '555-1234'
      };

      const createdContact = {
        id: '123',
        company_id: companyId,
        ...newContact,
        is_primary: false,
        organization_clerk_id: 'org_test123'
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockReturnValue({
                      data: { id: companyId, name: 'Test Company' },
                      error: null
                    })
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

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(newContact)
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdContact);
    });

    it('should return 403 when user is not admin', async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ first_name: 'Test', last_name: 'User' })
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only administrators can create contacts');
    });

    it('should return 400 when required fields missing', async () => {
      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('First name and last name are required');
    });
  });
});