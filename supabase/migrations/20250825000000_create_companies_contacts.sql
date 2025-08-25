-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    
    -- Company information
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    
    -- Business details
    tax_id TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Additional info
    notes TEXT,
    tags TEXT[],
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive', 'prospect', 'archived')) DEFAULT 'active',
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Constraints
    CONSTRAINT unique_company_name_per_org UNIQUE(organization_clerk_id, name)
);

-- Create contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    
    -- Professional details
    title TEXT,
    department TEXT,
    
    -- Contact preferences
    is_primary BOOLEAN DEFAULT false,
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    
    -- Optional different address from company
    has_different_address BOOLEAN DEFAULT false,
    address TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Additional info
    notes TEXT,
    birthday DATE,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Constraints
    CONSTRAINT unique_contact_email_per_company UNIQUE(company_id, email)
);

-- Create indexes for better performance
CREATE INDEX idx_companies_org ON companies(organization_clerk_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_tags ON companies USING GIN(tags);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_org ON contacts(organization_clerk_id);
CREATE INDEX idx_contacts_primary ON contacts(company_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_contacts_email ON contacts(email);

-- Create trigger to ensure only one primary contact per company
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE contacts 
        SET is_primary = false 
        WHERE company_id = NEW.company_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_contact
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_contact();

-- Create function to get company with primary contact
CREATE OR REPLACE FUNCTION get_company_with_primary_contact(p_company_id UUID)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    company_website TEXT,
    company_industry TEXT,
    primary_contact_id UUID,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    primary_contact_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as company_id,
        c.name as company_name,
        c.website as company_website,
        c.industry as company_industry,
        con.id as primary_contact_id,
        CONCAT(con.first_name, ' ', con.last_name) as primary_contact_name,
        con.email as primary_contact_email,
        con.phone as primary_contact_phone,
        con.title as primary_contact_title
    FROM companies c
    LEFT JOIN contacts con ON con.company_id = c.id AND con.is_primary = true
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Add company_id to quotes table (nullable for transition period)
ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;
CREATE INDEX idx_quotes_company ON quotes(company_id);

-- Create RLS policies for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companies in their org" ON companies
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can create companies for their org" ON companies
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can update companies in their org" ON companies
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can delete companies in their org" ON companies
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Create RLS policies for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their org" ON contacts
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can create contacts for their org" ON contacts
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can update contacts in their org" ON contacts
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Users can delete contacts in their org" ON contacts
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Create function to migrate existing clients to companies and contacts
CREATE OR REPLACE FUNCTION migrate_clients_to_companies()
RETURNS void AS $$
DECLARE
    client_record RECORD;
    company_id UUID;
    contact_name_parts TEXT[];
BEGIN
    FOR client_record IN 
        SELECT * FROM clients 
        WHERE NOT EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.name = COALESCE(clients.company, clients.name)
            AND companies.organization_clerk_id = clients.organization_clerk_id
        )
    LOOP
        -- Create company record
        INSERT INTO companies (
            organization_clerk_id,
            name,
            address,
            city,
            state_province,
            postal_code,
            country,
            notes,
            tags,
            created_at,
            updated_at,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            client_record.organization_clerk_id,
            COALESCE(client_record.company, client_record.name),
            client_record.address,
            client_record.city,
            client_record.state_province,
            client_record.postal_code,
            client_record.country,
            client_record.notes,
            client_record.tags,
            client_record.created_at,
            client_record.updated_at,
            client_record.created_by_clerk_user_id,
            client_record.created_by_name
        ) RETURNING id INTO company_id;
        
        -- Split name into first and last (simple split on last space)
        contact_name_parts := string_to_array(client_record.name, ' ');
        
        -- Create contact record
        INSERT INTO contacts (
            organization_clerk_id,
            company_id,
            first_name,
            last_name,
            email,
            phone,
            is_primary,
            created_at,
            updated_at,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            client_record.organization_clerk_id,
            company_id,
            CASE 
                WHEN array_length(contact_name_parts, 1) > 1 
                THEN array_to_string(contact_name_parts[1:array_length(contact_name_parts, 1)-1], ' ')
                ELSE client_record.name
            END,
            CASE 
                WHEN array_length(contact_name_parts, 1) > 1 
                THEN contact_name_parts[array_length(contact_name_parts, 1)]
                ELSE ''
            END,
            client_record.email,
            client_record.phone,
            true, -- Set as primary contact
            client_record.created_at,
            client_record.updated_at,
            client_record.created_by_clerk_user_id,
            client_record.created_by_name
        );
        
        -- Update quotes to reference the new company
        UPDATE quotes 
        SET company_id = company_id 
        WHERE client_id = client_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: To run the migration, execute:
-- SELECT migrate_clients_to_companies();
-- This is commented out to allow manual execution after verification
-- SELECT migrate_clients_to_companies();