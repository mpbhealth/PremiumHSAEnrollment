/*
  # Schedule automated cleanup for expired enrollment drafts

  1. Prerequisites
    - Requires pg_cron extension to be enabled in Supabase
    - Enable via Dashboard: Database > Extensions > pg_cron
    - Or via SQL: CREATE EXTENSION IF NOT EXISTS pg_cron;

  2. Scheduled Job Setup
    - Job name: `cleanup-expired-enrollment-drafts`
    - Schedule: Daily at 2:00 AM UTC (cron: '0 2 * * *')
    - Action: Calls cleanup_expired_enrollment_drafts() function
    - Behavior: Deletes drafts where expires_at < NOW() and status is 'in_progress' or 'abandoned'

  3. Operation Details
    - Unschedules any existing job with the same name first (idempotent)
    - Creates new scheduled job with proper configuration
    - Job runs with database owner privileges
    - Execution history tracked in cron.job_run_details table

  4. Monitoring
    - Check scheduled jobs: SELECT * FROM cron.job;
    - View execution history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
    - Manual trigger (if needed): SELECT cleanup_expired_enrollment_drafts();

  5. Important Notes
    - This job only deletes expired drafts as a safety net
    - Application code handles immediate deletion after successful enrollments
    - Completed enrollments (status='completed') are never deleted by this job
    - 48-hour expiration applies only to 'in_progress' and 'abandoned' drafts
*/

-- Unschedule any existing job with the same name (idempotent operation)
SELECT cron.unschedule('cleanup-expired-enrollment-drafts')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-enrollment-drafts'
);

-- Schedule the daily cleanup job at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-expired-enrollment-drafts',           -- Job name
  '0 2 * * *',                                    -- Cron schedule: Daily at 2:00 AM UTC
  'SELECT cleanup_expired_enrollment_drafts();'  -- SQL command to execute
);

-- Add comment to the scheduled job for documentation
COMMENT ON EXTENSION pg_cron IS 
  'Automated job scheduler for PostgreSQL. 
   Currently used for: 
   - Daily cleanup of expired enrollment drafts at 2:00 AM UTC';
