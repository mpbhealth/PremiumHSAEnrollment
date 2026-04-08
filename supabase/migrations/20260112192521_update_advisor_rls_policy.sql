/*
  # Update advisor RLS policy name
  
  1. Changes
    - Drop temporary policy
    - Create permanent policy with proper naming
  
  2. Security
    - Maintains public read access required for production enrollment flow
*/

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

-- Create permanent policy if it doesn't exist
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