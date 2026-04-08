/*
  # Drop enrollment_drafts table and all related objects

  ## Why This Migration Exists
  - Enrollment form data is now held entirely in-memory via React state
  - Sensitive PII (credit card numbers, SSNs, routing/account numbers) must not be stored in the database
  - Step navigation works via client-side state only
  - The "resume after browser close" feature is intentionally removed as a security improvement

  ## Objects Removed
  1. pg_cron scheduled job: `cleanup-expired-enrollment-drafts`
  2. Function: `cleanup_expired_enrollment_drafts()`
  3. Function: `update_enrollment_draft_timestamp()` (CASCADE removes its trigger)
  4. Table: `enrollment_drafts` (CASCADE removes RLS policies, indexes, triggers)

  ## Security Impact
  - Eliminates all database-level storage of sensitive member PII
  - No SSN, credit card, or bank account data persists beyond the browser session
  - Reduces attack surface for data breaches
*/

-- 1. Unschedule the pg_cron cleanup job (if it exists)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-enrollment-drafts');
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_function THEN NULL;
  WHEN others THEN NULL;
END $$;

-- 2. Drop the cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_enrollment_drafts();

-- 3. Drop the timestamp trigger function (CASCADE removes the trigger)
DROP FUNCTION IF EXISTS update_enrollment_draft_timestamp() CASCADE;

-- 4. Drop the enrollment_drafts table (CASCADE removes RLS policies, indexes)
DROP TABLE IF EXISTS enrollment_drafts CASCADE;
