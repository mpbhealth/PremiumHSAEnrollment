/*
  # Create Storage Bucket for Enrollment PDFs
  
  1. Storage Bucket Setup
    - Create "enrollment-documents" storage bucket
    - Configure bucket as PUBLIC for PDF downloads via public URLs
    - Set maximum file size limit to 10MB per PDF
    - Restrict uploads to PDF files only (application/pdf MIME type)
  
  2. Important Notes
    - Bucket is PUBLIC to enable direct PDF downloads via public URLs
    - File size limit: 10MB (10485760 bytes)
    - Only PDF files are allowed based on MIME type restriction
    - Storage policies are managed automatically by Supabase for public buckets
    - The Edge Function uses service role key for uploads, which bypasses RLS
*/

-- Create the storage bucket for enrollment PDFs
-- Using ON CONFLICT to make migration idempotent
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment-documents',
  'enrollment-documents', 
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];
