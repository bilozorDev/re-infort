# Quote System Seed Data

This directory contains comprehensive seed data for the quote management system designed for IT support companies.

## Files Overview

### 09_clients.sql
- **10 diverse clients** representing different business types:
  - Enterprise clients (TechCorp, DataSystems, EuroTech)
  - SMBs (Creative Studio, Consulting Plus)
  - Educational institutions (Bayview Academy)
  - Healthcare (Bay Area Health Clinic)
  - Individual freelancers
  - International clients
  - Prospects (potential clients)

### 10_services.sql
- **18 IT services** covering all aspects of IT support:
  - Technical Support (Level 1 & 2)
  - IT Consultation & Security Assessment
  - Hardware/Software Installation
  - Network Setup & Management
  - Cloud Services & Migration
  - Training & Education
  - Emergency & Priority Support
  - Monthly Maintenance Contracts
  - Data Recovery & Migration
  - Inactive/discontinued services (for testing)

### 11_quotes.sql
- **11 quotes** with various statuses demonstrating complete quote lifecycle:
  - **DRAFT** (2): QT-2024-001 (TechCorp), QT-2024-002 (Startup)
  - **SENT** (3): QT-2024-003 (Enterprise), QT-2024-004 (Education), QT-2024-005 (Creative)
  - **VIEWED** (1): QT-2024-006 (Consulting)
  - **APPROVED** (2): QT-2024-007 (Freelancer), QT-2024-008 (HIPAA Medical)
  - **DECLINED** (1): QT-2024-009 (Price sensitive prospect)
  - **EXPIRED** (1): QT-2024-010 (International timing issues)
  - **CONVERTED** (1): QT-2024-011 (Successful repeat client)

### 12_quote_items.sql
- **40+ quote items** showing realistic IT product/service combinations:
  - Hardware: Laptops, desktops, servers, monitors, network equipment
  - Services: Installation, training, consultation, security assessments
  - Various discount types and pricing strategies
  - Different quantities based on client size and needs

### 13_quote_events.sql
- **25+ quote events** tracking complete quote lifecycles:
  - Creation, updates, sending
  - Client viewing and interactions
  - Approvals, declines, conversions
  - Team notes and client feedback
  - Realistic timing and progression

## Key Features Demonstrated

### Quote Statuses
- Complete workflow from draft → sent → viewed → approved → converted
- Edge cases: declined quotes, expired quotes
- Time-based realistic progression

### Client Diversity
- Different industries (tech, healthcare, education, creative)
- Various sizes (individual, SMB, enterprise)
- Geographic diversity (local, national, international)
- Different payment terms and discount eligibilities

### Service Variety
- Hourly, project-based, and monthly recurring services
- Different skill levels and specializations
- Emergency and standard support options
- Training and consultation services

### Realistic Scenarios
- Repeat clients with established relationships
- New prospects with different needs
- Complex projects (HIPAA compliance, enterprise upgrades)
- Budget-conscious clients and premium services

## Usage

Run these seed files in order after running the main product/inventory seeds:

```bash
# After running 01-08 (existing seeds)
psql -d your_database -f 09_clients.sql
psql -d your_database -f 10_services.sql  
psql -d your_database -f 11_quotes.sql
psql -d your_database -f 12_quote_items.sql
psql -d your_database -f 13_quote_events.sql
```

## Organization Context
- Organization ID: `org_31Vn5FBdgy2geINV5ggcrmM7Oqi`
- User ID: `user_31VkPrT5Eh3UtaCmdlfDGLxCsaq`
- All data is scoped to this organization for proper multi-tenancy

This seed data provides a rich, realistic dataset for testing and demonstrating the complete quote management system functionality.