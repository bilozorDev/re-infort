-- Seed data for quotes with various statuses and scenarios
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing quote data
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quote_events CASCADE;

-- Get client and product IDs for reference
WITH client_refs AS (
  SELECT id, name, company FROM clients WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
),
product_refs AS (
  SELECT id, name, sku, price FROM products WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
),
service_refs AS (
  SELECT id, name, rate FROM services WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi' AND status = 'active'
)

-- Insert quotes with various statuses and scenarios
INSERT INTO quotes (
  quote_number,
  client_id,
  status,
  valid_from,
  valid_until,
  discount_type,
  discount_value,
  tax_rate,
  terms_and_conditions,
  notes,
  internal_notes,
  organization_clerk_id,
  created_by_clerk_user_id,
  assigned_to_clerk_user_id,
  assigned_to_name,
  created_at,
  updated_at
)
SELECT 
  quote_num,
  client_id,
  status,
  valid_from,
  valid_until,
  discount_type,
  discount_value,
  tax_rate,
  terms_conditions,
  notes,
  internal_notes,
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
  'Admin User',
  created_at,
  updated_at
FROM (
  VALUES
    -- DRAFT Quotes (recently created, being worked on)
    ('QT-2024-001', 
     (SELECT id FROM client_refs WHERE name = 'John Smith'), 
     'draft', 
     CURRENT_DATE, 
     CURRENT_DATE + INTERVAL '30 days',
     'percentage', 
     10.0, 
     8.5,
     'Net 30 days. All products subject to availability. Installation services available.',
     'Complete IT infrastructure upgrade for TechCorp main office.',
     'Client prefers Dell products. Schedule installation for weekends only.',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days'
    ),
    
    ('QT-2024-002',
     (SELECT id FROM client_refs WHERE name = 'Sarah Johnson'),
     'draft',
     CURRENT_DATE,
     CURRENT_DATE + INTERVAL '45 days',
     'fixed',
     500.0,
     7.25,
     'Net 15 days. Cloud services setup included. Training sessions available.',
     'Startup package: laptops, cloud migration, and basic support.',
     'New startup - payment terms might need adjustment. Very price sensitive.',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '1 day'
    ),

    -- SENT Quotes (waiting for client response)
    ('QT-2024-003',
     (SELECT id FROM client_refs WHERE name = 'Michael Chen'),
     'sent',
     CURRENT_DATE - INTERVAL '5 days',
     CURRENT_DATE + INTERVAL '25 days',
     'percentage',
     15.0,
     8.5,
     'Net 30 days. Volume discount applied. Phased delivery available.',
     'Enterprise server upgrade and network infrastructure.',
     'Large enterprise client - high priority. Decision makers meeting next week.',
     NOW() - INTERVAL '7 days',
     NOW() - INTERVAL '5 days'
    ),

    ('QT-2024-004',
     (SELECT id FROM client_refs WHERE name = 'Dr. Amanda Foster'),
     'sent',
     CURRENT_DATE - INTERVAL '10 days',
     CURRENT_DATE + INTERVAL '20 days',
     'percentage',
     12.0,
     0.0,
     'Net 30 days. Educational discount applied. Tax-exempt organization.',
     'Computer lab refresh for Bayview Academy.',
     'Educational client - tax exempt. Summer installation preferred.',
     NOW() - INTERVAL '12 days',
     NOW() - INTERVAL '10 days'
    ),

    ('QT-2024-005',
     (SELECT id FROM client_refs WHERE name = 'Lisa Rodriguez'),
     'sent',
     CURRENT_DATE - INTERVAL '3 days',
     CURRENT_DATE + INTERVAL '27 days',
     'percentage',
     8.0,
     8.5,
     'Net 30 days. Design software licensing included.',
     'Creative workstation setup with high-end graphics capabilities.',
     'Creative agency - needs color-accurate monitors. Rush delivery if approved.',
     NOW() - INTERVAL '4 days',
     NOW() - INTERVAL '3 days'
    ),

    -- VIEWED Quotes (client has seen the quote)
    ('QT-2024-006',
     (SELECT id FROM client_refs WHERE name = 'David Park'),
     'viewed',
     CURRENT_DATE - INTERVAL '8 days',
     CURRENT_DATE + INTERVAL '22 days',
     'fixed',
     750.0,
     8.5,
     'Net 30 days. Consulting services bundled with hardware.',
     'Office setup for new consulting branch office.',
     'Follow up scheduled for tomorrow. Very interested in managed services.',
     NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '6 days'
    ),

    -- APPROVED Quotes (client has approved, ready to convert)
    ('QT-2024-007',
     (SELECT id FROM client_refs WHERE name = 'Alex Thompson'),
     'approved',
     CURRENT_DATE - INTERVAL '15 days',
     CURRENT_DATE + INTERVAL '15 days',
     'percentage',
     5.0,
     8.5,
     'Net 15 days. Individual client discount applied.',
     'Freelancer home office setup with development workstation.',
     'Approved yesterday! Process order ASAP. Client very excited.',
     NOW() - INTERVAL '16 days',
     NOW() - INTERVAL '1 day'
    ),

    ('QT-2024-008',
     (SELECT id FROM client_refs WHERE name = 'Dr. Jennifer Martinez'),
     'approved',
     CURRENT_DATE - INTERVAL '12 days',
     CURRENT_DATE + INTERVAL '18 days',
     'percentage',
     8.0,
     8.5,
     'Net 30 days. HIPAA compliance included. Extended warranty.',
     'Medical practice HIPAA-compliant IT setup.',
     'Approved with compliance requirements. Schedule security audit post-installation.',
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '2 days'
    ),

    -- DECLINED Quotes (client has declined)
    ('QT-2024-009',
     (SELECT id FROM client_refs WHERE name = 'Robert Williams'),
     'declined',
     CURRENT_DATE - INTERVAL '20 days',
     CURRENT_DATE - INTERVAL '5 days',
     'percentage',
     10.0,
     8.5,
     'Net 30 days. Complete office setup package.',
     'Full office IT infrastructure for new company.',
     'Declined - went with competitor. Price was main factor. Follow up in 6 months.',
     NOW() - INTERVAL '25 days',
     NOW() - INTERVAL '5 days'
    ),

    -- EXPIRED Quotes (past valid_until date)
    ('QT-2024-010',
     (SELECT id FROM client_refs WHERE name = 'Philippe Dubois'),
     'expired',
     CURRENT_DATE - INTERVAL '60 days',
     CURRENT_DATE - INTERVAL '10 days',
     'percentage',
     12.0,
     20.0,
     'Net 30 days. International shipping included. EUR pricing available.',
     'European office setup with international support.',
     'Quote expired. Client had internal delays. Prepare revised quote with current pricing.',
     NOW() - INTERVAL '65 days',
     NOW() - INTERVAL '10 days'
    ),

    -- CONVERTED Quotes (converted to orders)
    ('QT-2024-011',
     (SELECT id FROM client_refs WHERE name = 'John Smith'),
     'converted',
     CURRENT_DATE - INTERVAL '45 days',
     CURRENT_DATE - INTERVAL '15 days',
     'percentage',
     15.0,
     8.5,
     'Net 30 days. Previous successful project reference.',
     'Additional workstations for TechCorp expansion.',
     'Successfully converted to Order #ORD-2024-001. Delivered and installed.',
     NOW() - INTERVAL '50 days',
     NOW() - INTERVAL '30 days'
    )
) AS quote_data(quote_num, client_id, status, valid_from, valid_until, discount_type, discount_value, tax_rate, terms_conditions, notes, internal_notes, created_at, updated_at);