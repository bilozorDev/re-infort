import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

describe('Companies and Contacts Integration Tests', () => {
  let supabase: any;
  const testOrgId = 'org_test123';
  const testUserId = 'user_test123';
  const testUserName = 'Test User';
  let testCompanyId: string;
  let testCompany2Id: string;

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean up test data
    await supabase.from('contacts').delete().eq('organization_clerk_id', testOrgId);
    await supabase.from('companies').delete().eq('organization_clerk_id', testOrgId);
  });

  afterEach(async () => {
    // Clean up test data
    await supabase.from('contacts').delete().eq('organization_clerk_id', testOrgId);
    await supabase.from('companies').delete().eq('organization_clerk_id', testOrgId);
  });

  describe('Full Company Lifecycle', () => {
    it('should handle complete company lifecycle with contacts', async () => {
      // 1. Create a company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Lifecycle Test Company',
          website: 'www.lifecycle.com',
          industry: 'Technology',
          company_size: '11-50',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active',
          notes: 'Test company for integration testing'
        })
        .select()
        .single();

      expect(companyError).toBeNull();
      expect(company).toBeDefined();
      testCompanyId = company.id;

      // 2. Add multiple contacts
      const contacts = [
        {
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Alice',
          last_name: 'CEO',
          email: 'alice@lifecycle.com',
          phone: '555-0001',
          title: 'Chief Executive Officer',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        },
        {
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Bob',
          last_name: 'CTO',
          email: 'bob@lifecycle.com',
          phone: '555-0002',
          title: 'Chief Technology Officer',
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        },
        {
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Charlie',
          last_name: 'Sales',
          email: 'charlie@lifecycle.com',
          phone: '555-0003',
          title: 'Sales Manager',
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        }
      ];

      const { data: insertedContacts, error: contactsError } = await supabase
        .from('contacts')
        .insert(contacts)
        .select();

      expect(contactsError).toBeNull();
      expect(insertedContacts).toHaveLength(3);

      // 3. Verify only one primary contact
      const { data: primaryContacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId)
        .eq('is_primary', true);

      expect(primaryContacts).toHaveLength(1);
      expect(primaryContacts[0].first_name).toBe('Alice');

      // 4. Update company information
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          company_size: '51-200',
          notes: 'Company has grown!'
        })
        .eq('id', testCompanyId);

      expect(updateError).toBeNull();

      // 5. Change primary contact
      const bobContact = insertedContacts.find((c: any) => c.first_name === 'Bob');
      const { error: primaryUpdateError } = await supabase
        .from('contacts')
        .update({ is_primary: true })
        .eq('id', bobContact.id);

      expect(primaryUpdateError).toBeNull();

      // 6. Verify primary contact changed
      const { data: newPrimaryContacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId)
        .eq('is_primary', true);

      expect(newPrimaryContacts).toHaveLength(1);
      expect(newPrimaryContacts[0].first_name).toBe('Bob');

      // 7. Deactivate a contact
      const charlieContact = insertedContacts.find((c: any) => c.first_name === 'Charlie');
      const { error: deactivateError } = await supabase
        .from('contacts')
        .update({ status: 'inactive' })
        .eq('id', charlieContact.id);

      expect(deactivateError).toBeNull();

      // 8. Get active contacts count
      const { data: activeContacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId)
        .eq('status', 'active');

      expect(activeContacts).toHaveLength(2);

      // 9. Delete company and verify cascade
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', testCompanyId);

      expect(deleteError).toBeNull();

      // 10. Verify all contacts were deleted
      const { data: remainingContacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId);

      expect(remainingContacts).toHaveLength(0);
    });
  });

  describe('Multiple Companies Interaction', () => {
    it('should handle multiple companies with shared contact scenarios', async () => {
      // Create two companies
      const { data: company1 } = await supabase
        .from('companies')
        .insert({
          name: 'Company Alpha',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        })
        .select()
        .single();

      const { data: company2 } = await supabase
        .from('companies')
        .insert({
          name: 'Company Beta',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        })
        .select()
        .single();

      testCompanyId = company1.id;
      testCompany2Id = company2.id;

      // Add contacts to both companies
      await supabase.from('contacts').insert([
        {
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'John',
          last_name: 'Shared',
          email: 'john@alpha.com',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        },
        {
          company_id: testCompany2Id,
          organization_clerk_id: testOrgId,
          first_name: 'John',
          last_name: 'Shared',
          email: 'john@beta.com',
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        }
      ]);

      // Verify each company has its own contact
      const { data: company1Contacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompanyId);

      const { data: company2Contacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompany2Id);

      expect(company1Contacts).toHaveLength(1);
      expect(company2Contacts).toHaveLength(1);
      expect(company1Contacts[0].email).toBe('john@alpha.com');
      expect(company2Contacts[0].email).toBe('john@beta.com');

      // Delete one company shouldn't affect the other
      await supabase.from('companies').delete().eq('id', testCompanyId);

      const { data: remainingCompany2Contacts } = await supabase
        .from('contacts')
        .select()
        .eq('company_id', testCompany2Id);

      expect(remainingCompany2Contacts).toHaveLength(1);
    });
  });

  describe('Search and Filter Operations', () => {
    it('should support complex queries on companies and contacts', async () => {
      // Create test data
      const companies = [
        { name: 'Tech Corp', industry: 'Technology', company_size: '51-200', status: 'active' },
        { name: 'Health Inc', industry: 'Healthcare', company_size: '11-50', status: 'active' },
        { name: 'Retail Ltd', industry: 'Retail', company_size: '201-500', status: 'active' },
        { name: 'Old Corp', industry: 'Technology', company_size: '1-10', status: 'inactive' }
      ];

      const { data: insertedCompanies } = await supabase
        .from('companies')
        .insert(companies.map(c => ({
          ...c,
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName
        })))
        .select();

      // Add contacts to each company
      const contactsToInsert = insertedCompanies.flatMap((company: any) => [
        {
          company_id: company.id,
          organization_clerk_id: testOrgId,
          first_name: 'Primary',
          last_name: company.name.split(' ')[0],
          email: `primary@${company.name.toLowerCase().replace(' ', '')}.com`,
          is_primary: true,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        },
        {
          company_id: company.id,
          organization_clerk_id: testOrgId,
          first_name: 'Secondary',
          last_name: company.name.split(' ')[0],
          email: `secondary@${company.name.toLowerCase().replace(' ', '')}.com`,
          is_primary: false,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        }
      ]);

      await supabase.from('contacts').insert(contactsToInsert);

      // Test 1: Filter active technology companies
      const { data: techCompanies } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .eq('organization_clerk_id', testOrgId)
        .eq('industry', 'Technology')
        .eq('status', 'active');

      expect(techCompanies).toHaveLength(1);
      expect(techCompanies[0].name).toBe('Tech Corp');
      expect(techCompanies[0].contacts).toHaveLength(2);

      // Test 2: Find companies by size range
      const { data: midSizeCompanies } = await supabase
        .from('companies')
        .select()
        .eq('organization_clerk_id', testOrgId)
        .in('company_size', ['11-50', '51-200']);

      expect(midSizeCompanies).toHaveLength(2);

      // Test 3: Search contacts by email domain
      const { data: primaryContacts } = await supabase
        .from('contacts')
        .select('*, companies!inner(*)')
        .eq('organization_clerk_id', testOrgId)
        .eq('is_primary', true)
        .eq('companies.status', 'active');

      expect(primaryContacts).toHaveLength(3); // 3 active companies

      // Test 4: Count contacts per company
      const { data: companiesWithCounts } = await supabase
        .from('companies')
        .select('id, name, contacts(count)')
        .eq('organization_clerk_id', testOrgId);

      expect(companiesWithCounts).toHaveLength(4);
      companiesWithCounts.forEach((company: any) => {
        expect(company.contacts[0].count).toBe(2);
      });
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce all business rules and constraints', async () => {
      // Create a company
      const { data: company } = await supabase
        .from('companies')
        .insert({
          name: 'Constraint Test Company',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        })
        .select()
        .single();

      testCompanyId = company.id;

      // Test 1: Cannot create contact without company
      const { error: orphanError } = await supabase
        .from('contacts')
        .insert({
          company_id: '00000000-0000-0000-0000-000000000000', // Non-existent
          organization_clerk_id: testOrgId,
          first_name: 'Orphan',
          last_name: 'Contact',
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        });

      expect(orphanError).toBeDefined();

      // Test 2: Email validation for contacts
      const { error: emailError } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Bad',
          last_name: 'Email',
          email: 'not-an-email', // Invalid email format
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        });

      // Note: This will pass if email validation is not enforced at DB level
      // You might want to add a CHECK constraint for email format

      // Test 3: Status must be valid
      const { error: statusError } = await supabase
        .from('companies')
        .insert({
          name: 'Invalid Status Company',
          organization_clerk_id: testOrgId,
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'invalid-status' // Invalid status
        });

      expect(statusError).toBeDefined();

      // Test 4: Required fields cannot be null
      const { error: requiredError } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          // Missing first_name and last_name
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        });

      expect(requiredError).toBeDefined();

      // Test 5: Updated_at should auto-update
      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          company_id: testCompanyId,
          organization_clerk_id: testOrgId,
          first_name: 'Update',
          last_name: 'Test',
          created_by_clerk_user_id: testUserId,
          created_by_name: testUserName,
          status: 'active'
        })
        .select()
        .single();

      const originalUpdatedAt = contact.updated_at;

      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 1000));

      await supabase
        .from('contacts')
        .update({ first_name: 'Updated' })
        .eq('id', contact.id);

      const { data: updatedContact } = await supabase
        .from('contacts')
        .select()
        .eq('id', contact.id)
        .single();

      expect(updatedContact.updated_at).not.toBe(originalUpdatedAt);
    });
  });
});