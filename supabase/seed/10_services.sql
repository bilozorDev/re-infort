-- Seed data for services
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing service data
TRUNCATE TABLE services CASCADE;

-- Insert sample services covering different categories and pricing models
INSERT INTO services (
  name, 
  description, 
  category, 
  rate_type, 
  rate, 
  unit, 
  status, 
  organization_clerk_id, 
  created_by_clerk_user_id,
  created_by_name
) VALUES
-- IT Support & Consultation
('Technical Support - Level 1', 'Basic technical support including troubleshooting, software installation, and user assistance', 'Technical Support', 'hourly', 75.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Technical Support - Level 2', 'Advanced technical support including system configuration, network troubleshooting, and complex issue resolution', 'Technical Support', 'hourly', 125.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('IT Consultation', 'Strategic IT planning and architecture consultation for business technology needs', 'Consultation', 'hourly', 200.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Security Assessment', 'Comprehensive security audit and vulnerability assessment of IT infrastructure', 'Security', 'fixed', 2500.00, 'per assessment', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Installation & Setup Services
('Hardware Installation', 'Professional installation and configuration of computer hardware, servers, and network equipment', 'Installation', 'hourly', 95.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Network Setup', 'Complete network design, installation, and configuration including WiFi, switches, and security', 'Network Services', 'fixed', 1200.00, 'per setup', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Software Installation & Configuration', 'Installation and setup of business software, operating systems, and applications', 'Installation', 'hourly', 85.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Maintenance & Support Contracts
('Monthly IT Maintenance', 'Comprehensive monthly maintenance including updates, monitoring, and preventive care', 'Maintenance', 'custom', 450.00, 'per month', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Remote Monitoring', '24/7 remote monitoring of systems with automated alerts and basic issue resolution', 'Monitoring', 'custom', 150.00, 'per device/month', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Training & Education
('User Training', 'Comprehensive training sessions for software and system usage, tailored to specific needs', 'Training', 'hourly', 110.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Administrator Training', 'Advanced training for system administrators on network management and security protocols', 'Training', 'fixed', 800.00, 'per day', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Data & Migration Services
('Data Migration', 'Professional data migration services including backup, transfer, and verification', 'Data Services', 'fixed', 1800.00, 'per migration', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Data Recovery', 'Emergency data recovery services for failed drives and corrupted systems', 'Data Services', 'fixed', 500.00, 'per recovery attempt', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Cloud Services
('Cloud Migration', 'Complete migration of on-premise systems to cloud infrastructure with minimal downtime', 'Cloud Services', 'fixed', 3500.00, 'per migration', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Cloud Management', 'Ongoing management and optimization of cloud infrastructure and services', 'Cloud Services', 'custom', 650.00, 'per month', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Emergency & Priority Services
('Emergency Support', 'After-hours emergency technical support with 2-hour response guarantee', 'Emergency Services', 'hourly', 180.00, 'per hour', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Priority Response', 'Same-day priority support with dedicated technician assignment', 'Emergency Services', 'fixed', 300.00, 'per incident', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

-- Inactive/Discontinued Services (for testing different statuses)
('Legacy System Support', 'Support for older systems and deprecated software - no longer offered', 'Legacy Support', 'hourly', NULL, 'per hour', 'inactive', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User'),

('Basic Email Setup', 'Simple email configuration service - replaced by comprehensive communication setup', 'Email Services', 'fixed', 150.00, 'per setup', 'inactive', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Admin User');