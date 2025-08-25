-- Seed data for service categories
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing service categories data
TRUNCATE TABLE service_categories CASCADE;

-- Insert service categories
INSERT INTO service_categories (
  name,
  description,
  status,
  organization_clerk_id,
  created_by_clerk_user_id,
  created_by_name
) VALUES
('Technical Support', 'Hardware and software technical support services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Consultation', 'IT strategy and planning consultation services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Security', 'Security assessments and cybersecurity services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Installation', 'Hardware and software installation services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Network Services', 'Network setup, configuration, and management', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Maintenance', 'Ongoing maintenance and monitoring services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Training', 'User and administrator training programs', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Data Services', 'Data migration, backup, and recovery services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Cloud Services', 'Cloud migration and management services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Emergency Services', 'Priority and emergency response services', 'active', 'org_test123', 'user_test123', 'Admin User'),
('Legacy Support', 'Support for older systems (inactive)', 'inactive', 'org_test123', 'user_test123', 'Admin User');