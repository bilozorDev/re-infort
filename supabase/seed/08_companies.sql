-- Insert companies
INSERT INTO companies (
    id,
    organization_clerk_id,
    name,
    website,
    industry,
    company_size,
    tax_id,
    address,
    city,
    state_province,
    postal_code,
    country,
    notes,
    status,
    created_at,
    updated_at,
    created_by_clerk_user_id,
    created_by_name
) VALUES 
    -- Active companies
    ('00000000-0000-0000-0000-000000000001', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Acme Corporation', 'www.acme.com', 'Technology', '201-500', '12-3456789', '100 Tech Drive', 'San Francisco', 'CA', '94105', 'United States', 'Key enterprise client with multiple departments', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000002', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Global Industries Inc.', 'www.globalindustries.com', 'Manufacturing', '1000+', '98-7654321', '500 Industrial Way', 'Detroit', 'MI', '48201', 'United States', 'Large manufacturing partner, handles bulk orders', 'active', NOW() - INTERVAL '150 days', NOW() - INTERVAL '5 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000003', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'StartUp Solutions', 'www.startupsolutions.io', 'Technology', '11-50', '45-1234567', '200 Innovation Blvd', 'Austin', 'TX', '78701', 'United States', 'Fast-growing startup, frequent small orders', 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000004', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Healthcare Partners LLC', 'www.healthcarepartners.com', 'Healthcare', '51-200', '67-8901234', '300 Medical Plaza', 'Boston', 'MA', '02108', 'United States', 'Medical equipment and supplies', 'active', NOW() - INTERVAL '200 days', NOW() - INTERVAL '3 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000005', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Retail Chain Group', 'www.retailchain.com', 'Retail', '501-1000', '23-4567890', '1000 Commerce Street', 'New York', 'NY', '10001', 'United States', 'Major retail chain with 50+ locations', 'active', NOW() - INTERVAL '250 days', NOW() - INTERVAL '1 day', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Prospect companies
    ('00000000-0000-0000-0000-000000000006', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Future Tech Innovations', 'www.futuretechinno.com', 'Technology', '1-10', NULL, '50 Startup Lane', 'Seattle', 'WA', '98101', 'United States', 'Potential new client, in discussions', 'prospect', NOW() - INTERVAL '30 days', NOW() - INTERVAL '7 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000007', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Regional Logistics Co', 'www.regionallogistics.com', 'Logistics', '11-50', NULL, '750 Transport Road', 'Chicago', 'IL', '60601', 'United States', 'Evaluating our services', 'prospect', NOW() - INTERVAL '45 days', NOW() - INTERVAL '14 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Inactive company
    ('00000000-0000-0000-0000-000000000008', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Legacy Systems Corp', 'www.legacysystems.com', 'Technology', '51-200', '89-0123456', '400 Old Tech Park', 'San Jose', 'CA', '95110', 'United States', 'Former client, may reactivate', 'inactive', NOW() - INTERVAL '365 days', NOW() - INTERVAL '60 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- International companies
    ('00000000-0000-0000-0000-000000000009', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'European Imports Ltd', 'www.europeanImports.eu', 'Import/Export', '11-50', 'EU-12345678', '25 Trade Center', 'London', NULL, 'EC1A 1BB', 'United Kingdom', 'European distribution partner', 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '4 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('00000000-0000-0000-0000-000000000010', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'Pacific Trading Company', 'www.pacifictrading.com.au', 'Import/Export', '51-200', 'AU-98765432', '100 Harbor View', 'Sydney', 'NSW', '2000', 'Australia', 'Asia-Pacific regional distributor', 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '6 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor');

-- Insert contacts for each company
INSERT INTO contacts (
    id,
    organization_clerk_id,
    company_id,
    first_name,
    last_name,
    email,
    phone,
    mobile,
    title,
    department,
    is_primary,
    preferred_contact_method,
    notes,
    status,
    created_at,
    updated_at,
    created_by_clerk_user_id,
    created_by_name
) VALUES 
    -- Acme Corporation contacts
    ('10000000-0000-0000-0000-000000000001', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000001', 'Robert', 'Smith', 'robert.smith@acme.com', '(555) 123-4001', '(555) 987-6001', 'CEO', 'Executive', true, 'email', 'Primary decision maker', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000002', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000001', 'Sarah', 'Johnson', 'sarah.johnson@acme.com', '(555) 123-4002', '(555) 987-6002', 'VP of Operations', 'Operations', false, 'phone', 'Handles day-to-day operations', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000003', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000001', 'Michael', 'Chen', 'michael.chen@acme.com', '(555) 123-4003', NULL, 'Procurement Manager', 'Procurement', false, 'email', 'Handles all purchasing decisions', 'active', NOW() - INTERVAL '150 days', NOW() - INTERVAL '10 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Global Industries Inc. contacts
    ('10000000-0000-0000-0000-000000000004', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000002', 'Jennifer', 'Williams', 'jennifer.williams@globalindustries.com', '(555) 234-5001', '(555) 876-5001', 'Chief Procurement Officer', 'Procurement', true, 'email', 'Final approval on all purchases', 'active', NOW() - INTERVAL '150 days', NOW() - INTERVAL '5 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000005', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000002', 'David', 'Brown', 'david.brown@globalindustries.com', '(555) 234-5002', NULL, 'Supply Chain Manager', 'Operations', false, 'phone', 'Manages inventory and logistics', 'active', NOW() - INTERVAL '150 days', NOW() - INTERVAL '5 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- StartUp Solutions contacts
    ('10000000-0000-0000-0000-000000000006', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000003', 'Alex', 'Martinez', 'alex.martinez@startupsolutions.io', '(555) 345-6001', '(555) 765-4001', 'Founder & CEO', 'Executive', true, 'mobile', 'Prefers text messages', 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000007', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000003', 'Emily', 'Davis', 'emily.davis@startupsolutions.io', '(555) 345-6002', NULL, 'Operations Lead', 'Operations', false, 'email', NULL, 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Healthcare Partners LLC contacts
    ('10000000-0000-0000-0000-000000000008', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000004', 'Dr. Patricia', 'Anderson', 'patricia.anderson@healthcarepartners.com', '(555) 456-7001', '(555) 654-3001', 'Chief Medical Officer', 'Medical', true, 'email', 'Reviews all medical equipment purchases', 'active', NOW() - INTERVAL '200 days', NOW() - INTERVAL '3 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000009', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000004', 'James', 'Wilson', 'james.wilson@healthcarepartners.com', '(555) 456-7002', NULL, 'Purchasing Director', 'Procurement', false, 'phone', 'Handles vendor relationships', 'active', NOW() - INTERVAL '200 days', NOW() - INTERVAL '3 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000010', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000004', 'Lisa', 'Thompson', 'lisa.thompson@healthcarepartners.com', '(555) 456-7003', NULL, 'Finance Manager', 'Finance', false, 'email', 'Approves budgets and payments', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '15 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Retail Chain Group contacts
    ('10000000-0000-0000-0000-000000000011', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000005', 'Richard', 'Garcia', 'richard.garcia@retailchain.com', '(555) 567-8001', '(555) 543-2001', 'VP of Merchandising', 'Merchandising', true, 'phone', 'Strategic partnerships', 'active', NOW() - INTERVAL '250 days', NOW() - INTERVAL '1 day', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000012', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000005', 'Nancy', 'Rodriguez', 'nancy.rodriguez@retailchain.com', '(555) 567-8002', NULL, 'Regional Manager', 'Operations', false, 'email', 'Manages West Coast operations', 'active', NOW() - INTERVAL '200 days', NOW() - INTERVAL '1 day', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Future Tech Innovations (Prospect)
    ('10000000-0000-0000-0000-000000000013', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000006', 'Kevin', 'Lee', 'kevin.lee@futuretechinno.com', '(555) 678-9001', '(555) 432-1001', 'Founder', 'Executive', true, 'mobile', 'New prospect, very interested', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '7 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Regional Logistics Co (Prospect)
    ('10000000-0000-0000-0000-000000000014', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000007', 'Mark', 'Taylor', 'mark.taylor@regionallogistics.com', '(555) 789-0001', NULL, 'Operations Director', 'Operations', true, 'email', 'Evaluating our services', 'active', NOW() - INTERVAL '45 days', NOW() - INTERVAL '14 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Legacy Systems Corp (Inactive)
    ('10000000-0000-0000-0000-000000000015', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000008', 'Thomas', 'White', 'thomas.white@legacysystems.com', '(555) 890-1001', NULL, 'IT Director', 'IT', true, 'email', 'Former contact, company inactive', 'inactive', NOW() - INTERVAL '365 days', NOW() - INTERVAL '60 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- European Imports Ltd contacts
    ('10000000-0000-0000-0000-000000000016', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000009', 'Oliver', 'Clarke', 'oliver.clarke@europeanImports.eu', '+44 20 7123 4567', '+44 7700 900123', 'Managing Director', 'Executive', true, 'email', 'UK time zone, prefers morning calls', 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '4 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000017', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000009', 'Sophie', 'Martin', 'sophie.martin@europeanImports.eu', '+44 20 7123 4568', NULL, 'Import Coordinator', 'Operations', false, 'email', 'Handles shipping documentation', 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '4 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    
    -- Pacific Trading Company contacts
    ('10000000-0000-0000-0000-000000000018', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000010', 'William', 'Chen', 'william.chen@pacifictrading.com.au', '+61 2 9123 4567', '+61 400 123 456', 'Regional Director', 'Executive', true, 'email', 'APAC time zone, available evenings US time', 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '6 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor'),
    ('10000000-0000-0000-0000-000000000019', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', '00000000-0000-0000-0000-000000000010', 'Jessica', 'Kim', 'jessica.kim@pacifictrading.com.au', '+61 2 9123 4568', NULL, 'Logistics Manager', 'Logistics', false, 'phone', 'Coordinates shipments to Asia', 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '6 days', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Alex Bilozor');

-- Update quotes to reference companies instead of clients
UPDATE quotes 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IN (
    SELECT id FROM clients WHERE name LIKE '%Acme%' OR company LIKE '%Acme%'
);

UPDATE quotes 
SET company_id = '00000000-0000-0000-0000-000000000002'
WHERE client_id IN (
    SELECT id FROM clients WHERE name LIKE '%Global%' OR company LIKE '%Global%'
);

UPDATE quotes 
SET company_id = '00000000-0000-0000-0000-000000000005'
WHERE client_id IN (
    SELECT id FROM clients WHERE name LIKE '%Retail%' OR company LIKE '%Retail%'
);

-- For any remaining quotes without a company, assign to the first active company
UPDATE quotes 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL AND client_id IS NOT NULL;