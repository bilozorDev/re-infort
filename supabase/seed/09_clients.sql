-- Seed data for clients
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing client data
TRUNCATE TABLE clients CASCADE;

-- Insert sample clients with diverse data
INSERT INTO clients (
  name, 
  email, 
  phone, 
  company, 
  address, 
  city, 
  state_province, 
  postal_code, 
  country, 
  notes, 
  tags, 
  organization_clerk_id, 
  created_by_clerk_user_id,
  created_by_name
) VALUES
-- Technology Companies
('John Smith', 'john.smith@techcorp.com', '+1-415-555-0101', 'TechCorp Inc', '100 Technology Drive', 'San Francisco', 'CA', '94105', 'USA', 'Primary contact for all IT procurement', ARRAY['enterprise', 'technology', 'high-value'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Sarah Johnson', 'sarah.johnson@innovatesoft.com', '+1-408-555-0202', 'InnovateSoft Solutions', '250 Innovation Way', 'San Jose', 'CA', '95110', 'USA', 'Startup focusing on cloud infrastructure', ARRAY['startup', 'cloud', 'recurring'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Michael Chen', 'mchen@datasystems.org', '+1-650-555-0303', 'DataSystems Corp', '500 Data Center Blvd', 'Palo Alto', 'CA', '94301', 'USA', 'Large enterprise client with multiple locations', ARRAY['enterprise', 'data', 'multi-location'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Small to Medium Businesses
('Lisa Rodriguez', 'lisa@creativestudio.design', '+1-415-555-0404', 'Creative Studio Design', '75 Creative Lane', 'San Francisco', 'CA', '94110', 'USA', 'Design agency needing workstations and software', ARRAY['design', 'creative', 'small-business'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('David Park', 'david.park@consultingplus.biz', '+1-925-555-0505', 'Consulting Plus LLC', '321 Business Park Dr', 'Walnut Creek', 'CA', '94596', 'USA', 'Management consulting firm', ARRAY['consulting', 'professional-services'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Educational Institutions
('Dr. Amanda Foster', 'a.foster@bayviewacademy.edu', '+1-415-555-0606', 'Bayview Academy', '1000 Education Ave', 'San Francisco', 'CA', '94132', 'USA', 'Private school upgrading computer lab', ARRAY['education', 'non-profit', 'bulk-orders'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Individual/Freelancer Clients
('Alex Thompson', 'alex.thompson@freelancer.com', '+1-510-555-0707', NULL, '456 Residential St', 'Oakland', 'CA', '94601', 'USA', 'Freelance developer and content creator', ARRAY['individual', 'freelancer'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Healthcare/Medical
('Dr. Jennifer Martinez', 'j.martinez@healthclinic.com', '+1-415-555-0808', 'Bay Area Health Clinic', '200 Medical Plaza', 'San Francisco', 'CA', '94115', 'USA', 'Medical practice needing HIPAA-compliant systems', ARRAY['healthcare', 'compliance', 'security-focused'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- International Clients
('Philippe Dubois', 'p.dubois@eurotech.fr', '+33-1-4555-0909', 'EuroTech SARL', '15 Rue de la Technologie', 'Paris', 'Île-de-France', '75001', 'France', 'European expansion project', ARRAY['international', 'enterprise', 'expansion'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Prospects (potential clients)
('Robert Williams', 'r.williams@prospectcorp.com', '+1-408-555-1010', 'Prospect Corporation', '999 Opportunity Blvd', 'San Jose', 'CA', '95134', 'USA', 'Interested in complete office setup - follow up needed', ARRAY['prospect', 'office-setup', 'follow-up'], 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User');