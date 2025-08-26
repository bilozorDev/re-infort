import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/companies/[id]/contacts/route';
import { PATCH as UPDATE_CONTACT, DELETE as DELETE_CONTACT } from '@/app/api/companies/[id]/contacts/[contactId]/route';
import { createClient } from '@/app/lib/supabase/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'user_test123' }))
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

describe('/api/companies/[id]/contacts', () => {
  let mockSupabase: any;
  const companyId = '00000000-0000-0000-0000-000000000001';
  const contactId = '10000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'contacts') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [
                    {
                      id: contactId,
                      company_id: companyId,
                      first_name: 'Robert',
                      last_name: 'Smith',
                      email: 'robert.smith@acme.com',
                      is_primary: true
                    },
                    {
                      id: '10000000-0000-0000-0000-000000000002',
                      company_id: companyId,
                      first_name: 'Sarah',
                      last_name: 'Johnson',
                      email: 'sarah.johnson@acme.com',
                      is_primary: false
                    }
                  ],
                  error: null
                }))
              })),
              single: vi.fn(() => ({
                data: {
                  id: contactId,
                  company_id: companyId,
                  first_name: 'Robert',
                  last_name: 'Smith',
                  email: 'robert.smith@acme.com',
                  is_primary: true
                },
                error: null
              }))
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: '10000000-0000-0000-0000-000000000003',
                    company_id: companyId,
                    first_name: 'New',
                    last_name: 'Contact',
                    email: 'new.contact@acme.com',
                    is_primary: false
                  },
                  error: null
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(() => ({
                      data: {
                        id: contactId,
                        company_id: companyId,
                        first_name: 'Updated',
                        last_name: 'Contact',
                        email: 'updated@acme.com',
                        is_primary: true
                      },
                      error: null
                    }))
                  }))
                }))
              })),
              match: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: {
                      id: contactId,
                      first_name: 'Updated',
                      last_name: 'Contact'
                    },
                    error: null
                  }))
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  data: null,
                  error: null
                }))
              })),
              match: vi.fn(() => ({
                data: null,
                error: null
              }))
            }))
          };
        }
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: companyId,
                    name: 'Acme Corporation',
                    organization_clerk_id: 'org_test123'
                  },
                  error: null
                }))
              }))
            }))
          };
        }
      })
    };

    (createClient as any).mockImplementation(() => Promise.resolve(mockSupabase));
  });

  describe('GET /api/companies/[id]/contacts', () => {
    it('should return list of contacts for a company', async () => {
      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].first_name).toBe('Robert');
      expect(data[0].is_primary).toBe(true);
    });

    it('should return 404 when company does not exist', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Company not found' }
            }))
          }))
        }))
      }));

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Company not found');
    });
  });

  describe('POST /api/companies/[id]/contacts', () => {
    it('should create a new contact for a company', async () => {
      const requestBody = {
        first_name: 'New',
        last_name: 'Contact',
        email: 'new.contact@acme.com',
        phone: '555-9999',
        is_primary: false
      };

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.first_name).toBe('New');
      expect(data.email).toBe('new.contact@acme.com');
    });

    it('should return 400 when required fields are missing', async () => {
      const requestBody = {
        email: 'test@example.com'
      };

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('First name and last name are required');
    });

    it('should return 403 when user is not admin', async () => {
      const { isAdmin } = await import('@/app/utils/roles');
      (isAdmin as any).mockResolvedValueOnce(false);

      const request = new NextRequest(`http://localhost:3000/api/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ first_name: 'Test', last_name: 'User' })
      });

      const response = await POST(request, { params: Promise.resolve({ id: companyId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only administrators can add contacts');
    });
  });

  describe('PUT /api/companies/[id]/contacts/[contactId]', () => {
    it('should update an existing contact', async () => {
      const requestBody = {
        first_name: 'Updated',
        last_name: 'Contact',
        email: 'updated@acme.com'
      };

      const request = new NextRequest(
        `http://localhost:3000/api/companies/${companyId}/contacts/${contactId}`,
        {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        }
      );

      const response = await UPDATE_CONTACT(request, { 
        params: Promise.resolve({ id: companyId, contactId: contactId }) 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.first_name).toBe('Updated');
      expect(data.email).toBe('updated@acme.com');
    });

    it('should return 404 when contact does not exist', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          match: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Contact not found' }
              }))
            }))
          }))
        }))
      }));

      const request = new NextRequest(
        `http://localhost:3000/api/companies/${companyId}/contacts/${contactId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ first_name: 'Test' })
        }
      );

      const response = await UPDATE_CONTACT(request, {
        params: Promise.resolve({ id: companyId, contactId: contactId })
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Contact not found');
    });
  });

  describe('DELETE /api/companies/[id]/contacts/[contactId]', () => {
    it('should delete a contact', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/companies/${companyId}/contacts/${contactId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE_CONTACT(request, {
        params: Promise.resolve({ id: companyId, contactId: contactId })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Contact deleted successfully');
    });

    it('should return 403 when user is not admin', async () => {
      const { isAdmin } = await import('@/app/utils/roles');
      (isAdmin as any).mockResolvedValueOnce(false);

      const request = new NextRequest(
        `http://localhost:3000/api/companies/${companyId}/contacts/${contactId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE_CONTACT(request, {
        params: Promise.resolve({ id: companyId, contactId: contactId })
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only administrators can delete contacts');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        delete: vi.fn(() => ({
          match: vi.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }));

      const request = new NextRequest(
        `http://localhost:3000/api/companies/${companyId}/contacts/${contactId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE_CONTACT(request, {
        params: Promise.resolve({ id: companyId, contactId: contactId })
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete contact');
    });
  });
});