-- Seed data for services
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing service data
TRUNCATE TABLE services CASCADE;

-- Insert sample services with service_category_id references
WITH service_category_ids AS (
  SELECT id, name FROM service_categories WHERE organization_clerk_id = 'org_test123'
)
INSERT INTO services (
  name, 
  description,
  service_category_id,
  rate_type, 
  rate, 
  unit, 
  status, 
  organization_clerk_id, 
  created_by_clerk_user_id,
  created_by_name
)
SELECT 
  s.name,
  s.description,
  sc.id,
  s.rate_type,
  s.rate,
  s.unit,
  s.status,
  'org_test123',
  'user_test123',
  'Admin User'
FROM (
  VALUES
  -- Technical Support Services
  ('Technical Support - Level 1', 'Basic technical support including troubleshooting, software installation, and user assistance', 'Technical Support', 'hourly', 75.00, 'per hour', 'active'),
  ('Technical Support - Level 2', 'Advanced technical support including system configuration, network troubleshooting, and complex issue resolution', 'Technical Support', 'hourly', 125.00, 'per hour', 'active'),
  
  -- Consultation Services
  ('IT Consultation', 'Strategic IT planning and architecture consultation for business technology needs', 'Consultation', 'hourly', 200.00, 'per hour', 'active'),
  
  -- Security Services
  ('Security Assessment', 'Comprehensive security audit and vulnerability assessment of IT infrastructure', 'Security', 'fixed', 2500.00, 'per assessment', 'active'),
  
  -- Installation Services
  ('Hardware Installation', 'Professional installation and configuration of computer hardware, servers, and network equipment', 'Installation', 'hourly', 95.00, 'per hour', 'active'),
  ('Software Installation & Configuration', 'Installation and setup of business software, operating systems, and applications', 'Installation', 'hourly', 85.00, 'per hour', 'active'),
  
  -- Network Services
  ('Network Setup', 'Complete network design, installation, and configuration including WiFi, switches, and security', 'Network Services', 'fixed', 1200.00, 'per setup', 'active'),
  
  -- Maintenance Services
  ('Monthly IT Maintenance', 'Comprehensive monthly maintenance including updates, monitoring, and preventive care', 'Maintenance', 'custom', 450.00, 'per month', 'active'),
  ('Remote Monitoring', '24/7 remote monitoring of systems with automated alerts and basic issue resolution', 'Maintenance', 'custom', 150.00, 'per device/month', 'active'),
  
  -- Training Services
  ('User Training', 'Comprehensive training sessions for software and system usage, tailored to specific needs', 'Training', 'hourly', 110.00, 'per hour', 'active'),
  ('Administrator Training', 'Advanced training for system administrators on network management and security protocols', 'Training', 'fixed', 800.00, 'per day', 'active'),
  
  -- Data Services
  ('Data Migration', 'Professional data migration services including backup, transfer, and verification', 'Data Services', 'fixed', 1800.00, 'per migration', 'active'),
  ('Data Recovery', 'Emergency data recovery services for failed drives and corrupted systems', 'Data Services', 'fixed', 500.00, 'per recovery attempt', 'active'),
  
  -- Cloud Services
  ('Cloud Migration', 'Complete migration of on-premise systems to cloud infrastructure with minimal downtime', 'Cloud Services', 'fixed', 3500.00, 'per migration', 'active'),
  ('Cloud Management', 'Ongoing management and optimization of cloud infrastructure and services', 'Cloud Services', 'custom', 650.00, 'per month', 'active'),
  
  -- Emergency Services
  ('Emergency Support', 'After-hours emergency technical support with 2-hour response guarantee', 'Emergency Services', 'hourly', 180.00, 'per hour', 'active'),
  ('Priority Response', 'Same-day priority support with dedicated technician assignment', 'Emergency Services', 'fixed', 300.00, 'per incident', 'active'),
  
  -- Legacy Support (inactive)
  ('Legacy System Support', 'Support for older systems and deprecated software - no longer offered', 'Legacy Support', 'hourly', NULL, 'per hour', 'inactive'),
  ('Basic Email Setup', 'Simple email configuration service - replaced by comprehensive communication setup', 'Legacy Support', 'fixed', 150.00, 'per setup', 'inactive')
) AS s(name, description, category_name, rate_type, rate, unit, status)
JOIN service_category_ids sc ON sc.name = s.category_name;