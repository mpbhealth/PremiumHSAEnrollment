/*
  # Allow public read access to advisor table

  1. Changes
    - Add policy to allow anonymous reads from advisor table
    - Enables frontend enrollment form to retrieve advisor credentials by sales_id

  2. Security Note
    - This intentionally exposes advisor API credentials for browser-based enrollment flow
    - Required for production: enrollment form queries advisor table from browser
    - Trade-off: Public credential access vs. frontend functionality requirement
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisor'
    AND policyname = 'Allow public read access for enrollment'
  ) THEN
    CREATE POLICY "Allow public read access for enrollment"
      ON advisor
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Drop the old temporary policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisor'
    AND policyname = 'TEMP: Allow anonymous read for debugging'
  ) THEN
    DROP POLICY "TEMP: Allow anonymous read for debugging" ON advisor;
  END IF;
END $$;