/*
  # Create enrollment_pdfs table for storing PDF metadata

  1. New Tables
    - `enrollment_pdfs`
      - `id` (uuid, primary key) - Unique identifier for each PDF record
      - `customer_email` (text, unique) - Customer email address used as primary key
      - `sanitized_filename` (text) - Sanitized version of email used for filename
      - `pdf_url` (text) - Public URL to access the stored PDF
      - `storage_path` (text) - Path to the PDF file in Supabase Storage
      - `created_at` (timestamptz) - Timestamp when the PDF was created
      - `metadata` (jsonb) - Additional enrollment data stored as JSON
  
  2. Security
    - Enable RLS on `enrollment_pdfs` table
    - Add policy for public read access to allow PDF retrieval
    - Add policy for service role to insert and update records
  
  3. Indexes
    - Index on `customer_email` for fast lookups
    - Index on `created_at` for date-based queries
*/

CREATE TABLE IF NOT EXISTS enrollment_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text UNIQUE NOT NULL,
  sanitized_filename text NOT NULL,
  pdf_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE enrollment_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to enrollment PDFs"
  ON enrollment_pdfs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role to insert enrollment PDFs"
  ON enrollment_pdfs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to update enrollment PDFs"
  ON enrollment_pdfs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_enrollment_pdfs_email 
  ON enrollment_pdfs(customer_email);

CREATE INDEX IF NOT EXISTS idx_enrollment_pdfs_created_at 
  ON enrollment_pdfs(created_at DESC);