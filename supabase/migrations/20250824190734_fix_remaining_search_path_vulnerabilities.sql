-- Fix remaining search path vulnerabilities for company/contact functions
-- These functions were created after the initial security fix

-- Apply search_path fix to company/contact functions (check if they exist first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_single_primary_contact' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.ensure_single_primary_contact() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_company_with_primary_contact' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_company_with_primary_contact(uuid) SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'migrate_clients_to_companies' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.migrate_clients_to_companies() SET search_path = '';
    END IF;
END $$;

-- Also ensure all future functions get the fix by running the comprehensive check again
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
    fixed_count INTEGER := 0;
BEGIN
    -- Fix any public functions that still don't have search_path set
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT COALESCE(p.proconfig, '{}') && ARRAY['search_path=']
    LOOP
        func_count := func_count + 1;
        
        -- Build and execute ALTER FUNCTION statement
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''',
                      func_record.function_name,
                      func_record.arguments);
        
        fixed_count := fixed_count + 1;
        
        RAISE NOTICE 'Fixed: public.%(%)', func_record.function_name, func_record.arguments;
    END LOOP;
    
    IF fixed_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '===== ADDITIONAL SECURITY FIXES =====';
        RAISE NOTICE 'Fixed search_path vulnerability for % additional public functions', fixed_count;
        RAISE NOTICE 'This prevents SQL injection attacks through search path manipulation';
    END IF;
    
    -- Final verification
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND NOT COALESCE(p.proconfig, '{}') && ARRAY['search_path='];
    
    IF func_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ All public functions are now secure with search_path protection!';
    ELSE
        RAISE WARNING '⚠️ % functions still need review', func_count;
    END IF;
    RAISE NOTICE '======================================';
END $$;