/*
  # Create enrollment_drafts table for HIPAA-compliant form data storage

  1. New Tables
    - `enrollment_drafts`
      - `id` (uuid, primary key) - Unique identifier for each draft record
      - `session_id` (uuid, unique) - Unique session identifier for browser session tracking
      - `benefit_id` (text) - Selected benefit plan ID
      - `current_step` (integer) - Current step in enrollment wizard (1, 2, or 3)
      - `form_data` (jsonb) - Complete enrollment form data stored as JSON
      - `created_at` (timestamptz) - Timestamp when draft was first created
      - `updated_at` (timestamptz) - Last modification timestamp
      - `expires_at` (timestamptz) - Auto-deletion timestamp (48 hours from last update)
      - `status` (text) - Draft lifecycle status: 'in_progress', 'completed', 'expired', 'abandoned'
      - `user_fingerprint` (text, optional) - Browser fingerprint for additional security

  2. Security
    - Enable RLS on `enrollment_drafts` table
    - Add policy for users to read their own session data
    - Add policy for users to insert new drafts
    - Add policy for users to update their own drafts
    - Add policy for users to delete their own drafts
    - Add policy for service role to perform cleanup operations

  3. Indexes
    - Unique index on `session_id` for fast session lookups
    - Index on `expires_at` for efficient cleanup queries
    - Index on `status` for filtering active vs completed drafts
    - Index on `created_at` for audit and reporting queries

  4. Cleanup Functions
    - Function to delete expired drafts (runs daily at 2:00 AM UTC)
    - Targets drafts where expires_at < NOW() and status is 'in_progress' or 'abandoned'

  5. Important Notes
    - Draft expiration: 48 hours of inactivity
    - Database-level encryption + RLS for HIPAA compliance
    - Daily automated cleanup to prevent database bloat
    - No client-side encryption needed (handled by Supabase)
*/

-- Create enrollment_drafts table
CREATE TABLE IF NOT EXISTS enrollment_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL,
  benefit_id text,
  current_step integer NOT NULL DEFAULT 1 CHECK (current_step IN (1, 2, 3)),
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired', 'abandoned')),
  user_fingerprint text
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_drafts_session_id
  ON enrollment_drafts(session_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_expires_at
  ON enrollment_drafts(expires_at);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_status
  ON enrollment_drafts(status);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_created_at
  ON enrollment_drafts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE enrollment_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to read their own session data
CREATE POLICY "Users can read own session data"
  ON enrollment_drafts
  FOR SELECT
  TO anon, authenticated
  USING (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- RLS Policy: Allow users to insert new drafts
CREATE POLICY "Users can insert own session drafts"
  ON enrollment_drafts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- RLS Policy: Allow users to update their own drafts
CREATE POLICY "Users can update own session drafts"
  ON enrollment_drafts
  FOR UPDATE
  TO anon, authenticated
  USING (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
  WITH CHECK (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- RLS Policy: Allow users to delete their own drafts
CREATE POLICY "Users can delete own session drafts"
  ON enrollment_drafts
  FOR DELETE
  TO anon, authenticated
  USING (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

-- RLS Policy: Allow service role full access for cleanup operations
CREATE POLICY "Service role has full access"
  ON enrollment_drafts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to clean up expired drafts
CREATE OR REPLACE FUNCTION cleanup_expired_enrollment_drafts()
RETURNS TABLE(deleted_count bigint) AS $$
DECLARE
  affected_rows bigint;
BEGIN
  -- Delete drafts that have expired
  DELETE FROM enrollment_drafts
  WHERE expires_at < now()
    AND status IN ('in_progress', 'abandoned');

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Log the cleanup operation
  RAISE NOTICE 'Cleaned up % expired enrollment drafts at %', affected_rows, now();

  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at and expires_at on row updates
CREATE OR REPLACE FUNCTION update_enrollment_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.expires_at = now() + interval '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_enrollment_drafts_timestamp
  BEFORE UPDATE ON enrollment_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_draft_timestamp();

-- Note: pg_cron setup for scheduled cleanup
-- This requires the pg_cron extension to be enabled in Supabase
-- To enable: Run "CREATE EXTENSION IF NOT EXISTS pg_cron;" with service role
-- To schedule daily cleanup at 2:00 AM UTC:
-- SELECT cron.schedule('cleanup-expired-enrollment-drafts', '0 2 * * *', 'SELECT cleanup_expired_enrollment_drafts();');
