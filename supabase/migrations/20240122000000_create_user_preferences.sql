-- Create user_preferences table for storing user-specific settings
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  organization_clerk_id TEXT NOT NULL,
  
  -- Table preferences stored as JSONB for flexibility
  table_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- UI preferences (theme, sidebar state, etc.)
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Feature flags or experimental settings
  feature_settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_user_preferences_clerk_user ON user_preferences(clerk_user_id);
CREATE INDEX idx_user_preferences_organization ON user_preferences(organization_clerk_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT
  USING (
    clerk_user_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claims', true)::json->>'user_id'
    )
  );

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE
  USING (
    clerk_user_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claims', true)::json->>'user_id'
    )
  );

-- Users can create their own preferences
CREATE POLICY "Users can create own preferences" ON user_preferences
  FOR INSERT
  WITH CHECK (
    clerk_user_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claims', true)::json->>'user_id'
    )
    AND organization_clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamp trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to atomically update table preferences for a specific table
CREATE OR REPLACE FUNCTION update_table_preferences(
  p_user_id TEXT,
  p_table_key TEXT,
  p_preferences JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Try to update existing record
  UPDATE user_preferences
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
    INSERT INTO user_preferences (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_table_preferences TO authenticated;