
-- Create a comprehensive user interaction logging system

-- First, let's add some missing columns to existing tables for better tracking
ALTER TABLE facility_usage_logs 
ADD COLUMN IF NOT EXISTS session_id uuid,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS duration_ms integer;

-- Create a new table for AI conversation logging
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  session_id uuid,
  user_id uuid,
  question text NOT NULL,
  response text NOT NULL,
  response_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create a table for label generation tracking
CREATE TABLE IF NOT EXISTS label_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  session_id uuid,
  user_id uuid,
  product_name text NOT NULL,
  manufacturer text,
  hazard_codes jsonb DEFAULT '[]'::jsonb,
  pictograms jsonb DEFAULT '[]'::jsonb,
  label_type text DEFAULT 'secondary_container',
  action_type text NOT NULL, -- 'generate', 'print', 'download'
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create a table for QR code interactions
CREATE TABLE IF NOT EXISTS qr_code_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  qr_code_id uuid REFERENCES qr_codes(id),
  session_id uuid,
  user_id uuid,
  action_type text NOT NULL, -- 'download', 'print', 'copy_url', 'scan'
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create a table for SDS document interactions
CREATE TABLE IF NOT EXISTS sds_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  sds_document_id uuid REFERENCES sds_documents(id),
  session_id uuid,
  user_id uuid,
  action_type text NOT NULL, -- 'view', 'download', 'generate_label', 'ask_ai'
  search_query text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create a table for facility session tracking
CREATE TABLE IF NOT EXISTS facility_user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  session_token text UNIQUE NOT NULL,
  user_id uuid,
  start_time timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  total_duration_ms integer,
  page_views jsonb DEFAULT '[]'::jsonb,
  user_agent text,
  ip_address inet,
  location_lat double precision,
  location_lng double precision,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_facility_created ON ai_conversations(facility_id, created_at);
CREATE INDEX IF NOT EXISTS idx_label_generations_facility_created ON label_generations(facility_id, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_interactions_facility_created ON qr_code_interactions(facility_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sds_interactions_facility_created ON sds_interactions(facility_id, created_at);
CREATE INDEX IF NOT EXISTS idx_facility_sessions_facility_created ON facility_user_sessions(facility_id, created_at);

-- Create a function to automatically update last_activity on sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS trigger AS $$
BEGIN
  UPDATE facility_user_sessions 
  SET last_activity = now()
  WHERE session_token = NEW.session_id::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update session activity
DROP TRIGGER IF EXISTS trigger_update_session_on_usage ON facility_usage_logs;
CREATE TRIGGER trigger_update_session_on_usage
  AFTER INSERT ON facility_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

DROP TRIGGER IF EXISTS trigger_update_session_on_ai ON ai_conversations;
CREATE TRIGGER trigger_update_session_on_ai
  AFTER INSERT ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

DROP TRIGGER IF EXISTS trigger_update_session_on_label ON label_generations;
CREATE TRIGGER trigger_update_session_on_label
  AFTER INSERT ON label_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();
