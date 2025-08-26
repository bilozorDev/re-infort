-- Fix search_path vulnerability for update_table_preferences function
-- This function needs to be recreated with proper search_path to prevent SQL injection

DROP FUNCTION IF EXISTS public.update_table_preferences(TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.update_table_preferences(
  p_user_id TEXT,
  p_table_key TEXT,
  p_preferences JSONB
)
RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Try to update existing record
  UPDATE public.user_preferences
  SET 
    table_preferences = jsonb_set(
      COALESCE(table_preferences, '{}'::jsonb),
      ARRAY[p_table_key],
      p_preferences,
      true
    ),
    updated_at = now()
  WHERE clerk_user_id = p_user_id
  RETURNING table_preferences INTO v_result;
  
  -- If no rows were updated, create new record
  IF v_result IS NULL THEN
    INSERT INTO public.user_preferences (
      clerk_user_id,
      organization_clerk_id,
      table_preferences
    ) VALUES (
      p_user_id,
      COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
      ),
      jsonb_build_object(p_table_key, p_preferences)
    )
    RETURNING table_preferences INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.update_table_preferences TO authenticated;

-- Add notice for confirmation
DO $$
BEGIN
  RAISE NOTICE 'Fixed: public.update_table_preferences()';
END $$;