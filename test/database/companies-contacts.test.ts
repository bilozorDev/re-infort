import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test database URL and keys (these should be in your test environment)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

describe('Companies and Contacts Database Tests', () => {
  let supabase: any;
  const testOrgId = 'org_test123';
  const testUserId = 'user_test123';
  let testCompanyId: string;
  let testContactId: string;

  beforeEach(async () => {
    // Use service role for testing to bypass RLS
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean up test data
    await supabase.from('contacts').delete().eq('organization_clerk_id', testOrgId);
    await supabase.from('companies').delete().eq('organization_clerk_id', testOrgId);

    // Create a test company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company',
        organization_clerk_id: testOrgId,
        created_by_clerk_user_id: testUserId,
        created_by_name: 'Test User',
        status: 'active'
      })
      .select()
      .single();

    if (companyError) throw companyError;
    testCompanyId = company.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testCompanyId) {
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
  });

  describe('Company Creation', () => {
    it('should create a company with required fields', async () => {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: 'New Test Company',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('New Test Company');
      expect(data.status).toBe('active');
      expect(data.organization_clerk_id).toBe(testOrgId);
    });

    it('should enforce company_size check constraint', async () => {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: 'Invalid Size Company',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          company_size: 'invalid-size', // Invalid value
          status: 'active'
        });

      expect(error).toBeDefined();
      expect(error.message).toContain('company_size');
    });

    it('should enforce unique name per organization', async () => {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: 'Test Company', // Same name as existing
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        });

      expect(error).toBeDefined();
      expect(error.message).toContain('duplicate');
    });
  });

  describe('Contact Creation', () => {
    it('should create a contact for a company', async () => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.first_name).toBe('John');
      expect(data.last_name).toBe('Doe');
      expect(data.company_id).toBe(testCompanyId);
      testContactId = data.id;
    });

    it('should cascade delete contacts when company is deleted', async () => {
      // Create a contact
      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@test.com',
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      const contactId = contact.id;

      // Delete the company
      await supabase.from('companies').delete().eq('id', testCompanyId);

      // Check if contact was deleted
      const { data: deletedContact } = await supabase
        .from('contacts')
        .select()
        .eq('id', contactId)
        .single();

      expect(deletedContact).toBeNull();
    });
  });

  describe('Primary Contact Trigger', () => {
    it('should allow only one primary contact per company', async () => {
      // Create first primary contact
      const { data: contact1, error: error1 } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Primary',
          last_name: 'One',
          email: 'primary1@test.com',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(contact1.is_primary).toBe(true);

      // Create second primary contact - should unset the first
      const { data: contact2, error: error2 } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Primary',
          last_name: 'Two',
          email: 'primary2@test.com',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(contact2.is_primary).toBe(true);

      // Check that first contact is no longer primary
      const { data: updatedContact1 } = await supabase
        .from('contacts')
        .select()
        .eq('id', contact1.id)
        .single();

      expect(updatedContact1.is_primary).toBe(false);
    });

    it('should handle updating contact to primary', async () => {
      // Create two non-primary contacts
      const { data: contact1 } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Contact',
          last_name: 'One',
          email: 'contact1@test.com',
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      const { data: contact2 } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Contact',
          last_name: 'Two',
          email: 'contact2@test.com',
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        })
        .select()
        .single();

      // Update first contact to primary
      await supabase
        .from('contacts')
        .update({ is_primary: true })
        .eq('id', contact1.id);

      // Update second contact to primary
      await supabase
        .from('contacts')
        .update({ is_primary: true })
        .eq('id', contact2.id);

      // Check that only second contact is primary
      const { data: contacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId)
        .order('created_at');

      const primaryContacts = contacts.filter((c: any) => c.is_primary);
      expect(primaryContacts).toHaveLength(1);
      expect(primaryContacts[0].id).toBe(contact2.id);
    });
  });

  describe('RLS Policies', () => {
    it('should only allow users to see companies in their organization', async () => {
      // Create client with anon key to test RLS
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            'x-jwt-claims': JSON.stringify({ org_id: testOrgId })
          }
        }
      });

      // Should see companies from same org
      const { data: ownCompanies } = await anonClient
        .from('companies')
        .select();

      // Create another org's company (using service role)
      await supabase
        .from('companies')
        .insert({
          name: 'Other Org Company',
          organization_clerk_id: 'org_other',
          created_by_clerk_user_id: 'user_other',
          created_by_name: 'Other User',
          status: 'active'
        });

      // Should not see other org's companies
      const { data: allCompanies } = await anonClient
        .from('companies')
        .select();

      const otherOrgCompanies = allCompanies?.filter(
        (c: any) => c.organization_clerk_id === 'org_other'
      );
      expect(otherOrgCompanies).toHaveLength(0);
    });

    it('should enforce organization check on insert', async () => {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            'x-jwt-claims': JSON.stringify({ org_id: testOrgId })
          }
        }
      });

      // Should succeed with matching org
      const { error: successError } = await anonClient
        .from('companies')
        .insert({
          name: 'Allowed Company',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        });

      expect(successError).toBeNull();

      // Should fail with different org
      const { error: failError } = await anonClient
        .from('companies')
        .insert({
          name: 'Forbidden Company',
          organization_clerk_id: 'org_other',
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        });

      expect(failError).toBeDefined();
      expect(failError.message).toContain('violates');
    });
  });

  describe('get_company_with_primary_contact Function', () => {
    it('should return company with primary contact details', async () => {
      // Create a primary contact
      await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Primary',
          last_name: 'Contact',
          email: 'primary@test.com',
          phone: '555-1234',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: 'Test User',
          status: 'active'
        });

      // Call the function
      const { data, error } = await supabase
        .rpc('get_company_with_primary_contact', {
          company_id_param: testCompanyId
        });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.company_name).toBe('Test Company');
      expect(data.primary_contact_name).toBe('Primary Contact');
      expect(data.primary_contact_email).toBe('primary@test.com');
      expect(data.primary_contact_phone).toBe('555-1234');
    });

    it('should return null contact fields when no primary contact exists', async () => {
      const { data, error } = await supabase
        .rpc('get_company_with_primary_contact', {
          company_id_param: testCompanyId
        });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.company_name).toBe('Test Company');
      expect(data.primary_contact_name).toBeNull();
      expect(data.primary_contact_email).toBeNull();
    });
  });
});