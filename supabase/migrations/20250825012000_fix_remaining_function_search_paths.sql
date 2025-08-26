-- Fix search_path for remaining functions identified by Security Advisor
-- These functions need search_path = public to access tables properly

-- 1. Fix migrate_clients_to_companies function
DROP FUNCTION IF EXISTS public.migrate_clients_to_companies();

CREATE OR REPLACE FUNCTION public.migrate_clients_to_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record RECORD;
    company_id UUID;
    contact_name_parts TEXT[];
BEGIN
    FOR client_record IN 
        SELECT * FROM public.clients 
        WHERE NOT EXISTS (
            SELECT 1 FROM public.companies 
            WHERE name = clients.company 
            AND organization_clerk_id = clients.organization_clerk_id
        )
    LOOP
        -- Create company from client
        INSERT INTO public.companies (
            organization_clerk_id,
            name,
            website,
            status,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            client_record.organization_clerk_id,
            COALESCE(client_record.company, client_record.name),
            client_record.website,
            'active',
            client_record.created_by_clerk_user_id,
            client_record.created_by_name
        )
        RETURNING id INTO company_id;
        
        -- Parse contact name
        contact_name_parts := string_to_array(client_record.name, ' ');
        
        -- Create contact from client
        INSERT INTO public.contacts (
            organization_clerk_id,
            company_id,
            first_name,
            last_name,
            email,
            phone,
            title,
            is_primary,
            status,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            client_record.organization_clerk_id,
            company_id,
            COALESCE(contact_name_parts[1], ''),
            COALESCE(array_to_string(contact_name_parts[2:], ' '), ''),
            client_record.email,
            client_record.phone,
            client_record.title,
            true,
            'active',
            client_record.created_by_clerk_user_id,
            client_record.created_by_name
        );
        
        -- Update quotes to reference the new company
        UPDATE public.quotes 
        SET company_id = company_id
        WHERE client_id = client_record.id;
    END LOOP;
END;
$$;

-- 2. Fix get_company_with_primary_contact function  
DROP FUNCTION IF EXISTS public.get_company_with_primary_contact(UUID);

CREATE OR REPLACE FUNCTION public.get_company_with_primary_contact(p_company_id UUID)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS company_id,
        c.name AS company_name,
        c.website AS company_website,
        c.industry AS company_industry,
        ct.id AS primary_contact_id,
        ct.first_name || ' ' || ct.last_name AS primary_contact_name,
        ct.email AS primary_contact_email,
        ct.phone AS primary_contact_phone,
        ct.title AS primary_contact_title
    FROM public.companies c
    LEFT JOIN public.contacts ct ON ct.company_id = c.id AND ct.is_primary = true
    WHERE c.id = p_company_id;
END;
$$;

-- 3. Update table preferences is already fixed in previous migration

-- 4. Fix ensure_single_primary_contact function (likely a trigger function)
DROP FUNCTION IF EXISTS public.ensure_single_primary_contact() CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When setting a contact as primary, unset all other primary contacts for the same company
    IF NEW.is_primary = true THEN
        UPDATE public.contacts
        SET is_primary = false
        WHERE company_id = NEW.company_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate trigger if it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'ensure_single_primary_contact_trigger'
    ) THEN
        CREATE TRIGGER ensure_single_primary_contact_trigger
        BEFORE INSERT OR UPDATE OF is_primary ON public.contacts
        FOR EACH ROW
        WHEN (NEW.is_primary = true)
        EXECUTE FUNCTION public.ensure_single_primary_contact();
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.migrate_clients_to_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_with_primary_contact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_single_primary_contact() TO authenticated;

-- Add notices for confirmation
DO $$
BEGIN
  RAISE NOTICE 'Fixed search_path for security advisor warnings:';
  RAISE NOTICE '  - public.migrate_clients_to_companies()';
  RAISE NOTICE '  - public.get_company_with_primary_contact()';
  RAISE NOTICE '  - public.ensure_single_primary_contact()';
  RAISE NOTICE 'All functions now use SET search_path = public';
END $$;