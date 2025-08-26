-- Seed data for quotes with various statuses and scenarios
-- Using companies instead of clients

-- Clean up existing quote data
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quote_events CASCADE;

-- Insert quotes with various statuses and scenarios
INSERT INTO quotes (
  quote_number,
  company_id,
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
  created_by_name,
  assigned_to_clerk_user_id,
  assigned_to_name,
  created_at,
  updated_at
)
VALUES
  -- DRAFT Quotes (recently created, being worked on)
  ('QT-2024-001', 
   '00000000-0000-0000-0000-000000000001', -- Acme Corporation
   'draft', 
   CURRENT_DATE, 
   CURRENT_DATE + INTERVAL '30 days',
   'percentage', 
   10.0, 
   8.5,
   'Net 30 days. All products subject to availability. Installation services available.',
   'Complete IT infrastructure upgrade for Acme main office.',
   'Enterprise client - Robert Smith is primary decision maker. Schedule installation for weekends only.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '2 days',
   NOW() - INTERVAL '2 days'
  ),
  
  ('QT-2024-002',
   '00000000-0000-0000-0000-000000000003', -- StartUp Solutions
   'draft',
   CURRENT_DATE,
   CURRENT_DATE + INTERVAL '45 days',
   'fixed',
   500.0,
   7.25,
   'Net 15 days. Cloud services setup included. Training sessions available.',
   'Startup package: laptops, cloud migration, and basic support.',
   'New startup - payment terms might need adjustment. Alex Martinez prefers text communication.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '1 day'
  ),

  -- SENT Quotes (waiting for client response)
  ('QT-2024-003',
   '00000000-0000-0000-0000-000000000002', -- Global Industries Inc.
   'sent',
   CURRENT_DATE - INTERVAL '5 days',
   CURRENT_DATE + INTERVAL '25 days',
   'percentage',
   15.0,
   8.5,
   'Net 30 days. Volume discount applied. Phased delivery available.',
   'Enterprise server upgrade and network infrastructure.',
   'Large enterprise client - high priority. Jennifer Williams has final approval.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '7 days',
   NOW() - INTERVAL '5 days'
  ),

  ('QT-2024-004',
   '00000000-0000-0000-0000-000000000004', -- Healthcare Partners LLC
   'sent',
   CURRENT_DATE - INTERVAL '10 days',
   CURRENT_DATE + INTERVAL '20 days',
   'percentage',
   12.0,
   0.0,
   'Net 30 days. Healthcare compliance included. Tax-exempt organization.',
   'Medical equipment and IT infrastructure refresh.',
   'Healthcare client - tax exempt. Dr. Anderson must review all medical equipment.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '12 days',
   NOW() - INTERVAL '10 days'
  ),

  ('QT-2024-005',
   '00000000-0000-0000-0000-000000000005', -- Retail Chain Group
   'sent',
   CURRENT_DATE - INTERVAL '3 days',
   CURRENT_DATE + INTERVAL '27 days',
   'percentage',
   8.0,
   8.5,
   'Net 30 days. Multi-location deployment included.',
   'POS system upgrade for 50+ retail locations.',
   'Retail chain - needs phased rollout. Richard Garcia coordinating with regional managers.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '4 days',
   NOW() - INTERVAL '3 days'
  ),

  -- VIEWED Quotes (client has seen the quote)
  ('QT-2024-006',
   '00000000-0000-0000-0000-000000000006', -- Future Tech Innovations (Prospect)
   'viewed',
   CURRENT_DATE - INTERVAL '8 days',
   CURRENT_DATE + INTERVAL '22 days',
   'fixed',
   750.0,
   8.5,
   'Net 30 days. Startup special pricing. Flexible payment terms.',
   'Initial setup for new tech startup.',
   'Prospect company - Kevin Lee very interested. Follow up scheduled for tomorrow.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '10 days',
   NOW() - INTERVAL '6 days'
  ),

  -- APPROVED Quotes (client has approved, ready to convert)
  ('QT-2024-007',
   '00000000-0000-0000-0000-000000000001', -- Acme Corporation
   'approved',
   CURRENT_DATE - INTERVAL '15 days',
   CURRENT_DATE + INTERVAL '15 days',
   'percentage',
   5.0,
   8.5,
   'Net 15 days. Priority support included.',
   'Additional workstations for new department.',
   'Approved by Sarah Johnson (VP Operations)! Process order ASAP.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '16 days',
   NOW() - INTERVAL '1 day'
  ),

  ('QT-2024-008',
   '00000000-0000-0000-0000-000000000004', -- Healthcare Partners LLC
   'approved',
   CURRENT_DATE - INTERVAL '12 days',
   CURRENT_DATE + INTERVAL '18 days',
   'percentage',
   8.0,
   8.5,
   'Net 30 days. HIPAA compliance included. Extended warranty.',
   'Medical practice HIPAA-compliant IT setup.',
   'Approved with compliance requirements. James Wilson handling procurement.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '14 days',
   NOW() - INTERVAL '2 days'
  ),

  -- DECLINED Quotes (client has declined)
  ('QT-2024-009',
   '00000000-0000-0000-0000-000000000007', -- Regional Logistics Co (Prospect)
   'declined',
   CURRENT_DATE - INTERVAL '20 days',
   CURRENT_DATE - INTERVAL '5 days',
   'percentage',
   10.0,
   8.5,
   'Net 30 days. Logistics software integration included.',
   'Warehouse management system and hardware.',
   'Declined - went with competitor. Mark Taylor said price was main factor. Follow up in 6 months.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '25 days',
   NOW() - INTERVAL '5 days'
  ),

  -- EXPIRED Quotes (past valid_until date)
  ('QT-2024-010',
   '00000000-0000-0000-0000-000000000009', -- European Imports Ltd
   'expired',
   CURRENT_DATE - INTERVAL '60 days',
   CURRENT_DATE - INTERVAL '10 days',
   'percentage',
   12.0,
   20.0,
   'Net 30 days. International shipping included. EUR pricing available.',
   'European office setup with international support.',
   'Quote expired. Oliver Clarke had internal delays. Prepare revised quote with current pricing.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '65 days',
   NOW() - INTERVAL '10 days'
  ),

  -- CONVERTED Quotes (converted to orders)
  ('QT-2024-011',
   '00000000-0000-0000-0000-000000000002', -- Global Industries Inc.
   'converted',
   CURRENT_DATE - INTERVAL '45 days',
   CURRENT_DATE - INTERVAL '15 days',
   'percentage',
   15.0,
   8.5,
   'Net 30 days. Previous successful project reference.',
   'Manufacturing floor automation systems.',
   'Successfully converted to Order #ORD-2024-001. David Brown coordinated delivery.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '50 days',
   NOW() - INTERVAL '30 days'
  ),

  ('QT-2024-012',
   '00000000-0000-0000-0000-000000000010', -- Pacific Trading Company
   'converted',
   CURRENT_DATE - INTERVAL '35 days',
   CURRENT_DATE - INTERVAL '5 days',
   'percentage',
   10.0,
   10.0,
   'Net 45 days. International payment terms. AUD pricing.',
   'APAC distribution center IT infrastructure.',
   'Converted to Order #ORD-2024-002. William Chen very satisfied. Jessica Kim handling logistics.',
   'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq',
   'Alex Bilozor',
   NOW() - INTERVAL '40 days',
   NOW() - INTERVAL '20 days'
  );