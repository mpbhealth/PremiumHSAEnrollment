/*
  # Remove automatic expiration extension for enrollment drafts

  1. Changes to existing tables
    - `enrollment_drafts` table behavior modification

  2. Trigger Function Updates
    - Modify `update_enrollment_draft_timestamp()` to only update `updated_at`
    - Remove automatic extension of `expires_at` on updates
    - Drafts will now keep their original 48-hour expiration from creation

  3. Behavior Changes
    - New drafts still get 48-hour expiration from creation time
    - Updates no longer extend the expiration time
    - Application code handles immediate deletion on API success/failure responses
    - Cleanup function remains as safety net for truly abandoned sessions

  4. Important Notes
    - This ensures drafts are deleted immediately after successful enrollment via app logic
    - The 48-hour expiration serves only as a safety net for abandoned sessions
    - No changes to RLS policies or table structure
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_enrollment_drafts_timestamp ON enrollment_drafts;

-- Drop the existing function
DROP FUNCTION IF EXISTS update_enrollment_draft_timestamp();

-- Recreate the function WITHOUT expiration extension
CREATE OR REPLACE FUNCTION update_enrollment_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update the updated_at timestamp
  -- Do NOT extend expires_at - it stays at original value from creation
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_enrollment_drafts_timestamp
  BEFORE UPDATE ON enrollment_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_draft_timestamp();

-- Update the cleanup function comment for clarity
COMMENT ON FUNCTION cleanup_expired_enrollment_drafts() IS
  'Cleans up enrollment drafts that have exceeded their 48-hour expiration time.
   Serves as a safety net for abandoned sessions since the application handles
   immediate deletion on successful/failed API responses.';
