/*
  # Increase Advisor Password Field Size for Encryption

  1. Changes
    - Increase `password` column from VARCHAR(50) to VARCHAR(255)
    - Increase `username` column from VARCHAR(50) to VARCHAR(255) for consistency
    
  2. Purpose
    - Support AES-256 encrypted password storage
    - Encrypted strings are typically 150-200 characters
    - Allows secure password storage in the database
    
  3. Notes
    - This migration is safe and does not lose any data
    - Existing passwords will remain unchanged
    - Future passwords should be stored encrypted using AES-256
*/

DO $$
BEGIN
  -- Increase password column size to accommodate encrypted passwords
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advisor' AND column_name = 'password' AND character_maximum_length = 50
  ) THEN
    ALTER TABLE advisor ALTER COLUMN password TYPE VARCHAR(255);
  END IF;

  -- Increase username column size for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advisor' AND column_name = 'username' AND character_maximum_length = 50
  ) THEN
    ALTER TABLE advisor ALTER COLUMN username TYPE VARCHAR(255);
  END IF;
END $$;
