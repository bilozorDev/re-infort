-- Seed data for quote events (lifecycle tracking)
-- Using test organization and user IDs

-- Clean up existing quote events data
TRUNCATE TABLE quote_events CASCADE;

-- Get reference IDs for quotes
WITH quote_refs AS (
  SELECT id, quote_number, status, created_at FROM quotes WHERE organization_clerk_id = 'org_test123'
)

-- Insert quote events showing realistic quote lifecycle progression
INSERT INTO quote_events (
  quote_id,
  event_type,
  user_type,
  user_id,
  user_name,
  event_metadata,
  organization_clerk_id,
  created_at
)
SELECT 
  quote_id,
  event_type,
  user_type,
  user_id,
  user_name,
  jsonb_build_object('notes', notes),
  'org_test123',
  event_time
FROM (
  VALUES
    -- QT-2024-001: TechCorp IT Infrastructure (DRAFT) - Recent creation
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-001'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Initial quote created for TechCorp infrastructure upgrade', 
     NOW() - INTERVAL '2 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-001'), 
     'updated', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Added user training services per client request', 
     NOW() - INTERVAL '1 day'),

    -- QT-2024-002: Sarah Johnson Startup (DRAFT) - Recently updated
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-002'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Startup package quote created', 
     NOW() - INTERVAL '1 day'),

    -- QT-2024-003: Michael Chen Enterprise (SENT) - Full lifecycle
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-003'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Enterprise server upgrade quote created', 
     NOW() - INTERVAL '7 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-003'), 
     'updated', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Added security assessment and increased volume discount', 
     NOW() - INTERVAL '6 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-003'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to client via email', 
     NOW() - INTERVAL '5 days'),

    -- QT-2024-004: Bayview Academy (SENT) - Educational client
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-004'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Computer lab quote created with educational discounts', 
     NOW() - INTERVAL '12 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-004'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to Dr. Foster for school board review', 
     NOW() - INTERVAL '10 days'),

    -- QT-2024-005: Creative Studio (SENT) - Rush job
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-005'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Creative workstation quote with rush delivery options', 
     NOW() - INTERVAL '4 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-005'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent with expedited timeline for creative project', 
     NOW() - INTERVAL '3 days'),

    -- QT-2024-006: David Park Consulting (VIEWED) - Client engagement
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-006'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Consulting office setup quote created', 
     NOW() - INTERVAL '10 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-006'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to David Park for new branch office', 
     NOW() - INTERVAL '8 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-006'), 
     'viewed', 
     'client', 
     NULL, 
     'David Park', 
     'Client viewed quote via secure link', 
     NOW() - INTERVAL '6 days'),

    -- QT-2024-007: Alex Thompson Freelancer (APPROVED) - Success story
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-007'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Freelancer development setup quote', 
     NOW() - INTERVAL '16 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-007'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to Alex Thompson', 
     NOW() - INTERVAL '14 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-007'), 
     'viewed', 
     'client', 
     NULL, 
     'Alex Thompson', 
     'Client viewed quote', 
     NOW() - INTERVAL '13 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-007'), 
     'approved', 
     'client', 
     NULL, 
     'Alex Thompson', 
     'Client approved quote - excited to get started!', 
     NOW() - INTERVAL '1 day'),

    -- QT-2024-008: Dr. Martinez HIPAA (APPROVED) - Complex compliance project
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-008'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'HIPAA-compliant medical practice setup quote', 
     NOW() - INTERVAL '14 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-008'), 
     'updated', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Added additional security requirements and compliance training', 
     NOW() - INTERVAL '12 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-008'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent with HIPAA compliance documentation', 
     NOW() - INTERVAL '10 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-008'), 
     'viewed', 
     'client', 
     NULL, 
     'Dr. Jennifer Martinez', 
     'Client reviewed quote and compliance requirements', 
     NOW() - INTERVAL '8 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-008'), 
     'approved', 
     'client', 
     NULL, 
     'Dr. Jennifer Martinez', 
     'Approved after legal review of compliance requirements', 
     NOW() - INTERVAL '2 days'),

    -- QT-2024-009: Robert Williams Prospect (DECLINED) - Learning experience
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-009'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Complete office setup quote for new prospect', 
     NOW() - INTERVAL '25 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-009'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to Robert Williams at Prospect Corp', 
     NOW() - INTERVAL '20 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-009'), 
     'viewed', 
     'client', 
     NULL, 
     'Robert Williams', 
     'Client viewed quote multiple times', 
     NOW() - INTERVAL '15 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-009'), 
     'declined', 
     'client', 
     NULL, 
     'Robert Williams', 
     'Declined - price too high, went with local competitor', 
     NOW() - INTERVAL '5 days'),

    -- QT-2024-010: Philippe Dubois International (EXPIRED) - Timing issues
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-010'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'International office setup quote with EUR pricing', 
     NOW() - INTERVAL '65 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-010'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to Philippe in Paris office', 
     NOW() - INTERVAL '60 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-010'), 
     'viewed', 
     'client', 
     NULL, 
     'Philippe Dubois', 
     'Client viewed quote but indicated internal delays', 
     NOW() - INTERVAL '45 days'),

    -- QT-2024-011: TechCorp Additional (CONVERTED) - Success story
    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-011'), 
     'created', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Additional workstations for existing client TechCorp', 
     NOW() - INTERVAL '50 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-011'), 
     'sent', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote sent to John Smith for expansion project', 
     NOW() - INTERVAL '45 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-011'), 
     'viewed', 
     'client', 
     NULL, 
     'John Smith', 
     'Client reviewed quote quickly due to previous satisfaction', 
     NOW() - INTERVAL '42 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-011'), 
     'approved', 
     'client', 
     NULL, 
     'John Smith', 
     'Approved based on previous successful project', 
     NOW() - INTERVAL '40 days'),

    ((SELECT id FROM quote_refs WHERE quote_number = 'QT-2024-011'), 
     'converted', 
     'team', 
     'user_test123', 
     'Admin User', 
     'Quote converted to Order #ORD-2024-001, successfully delivered', 
     NOW() - INTERVAL '30 days')

) AS event_data(quote_id, event_type, user_type, user_id, user_name, notes, event_time);