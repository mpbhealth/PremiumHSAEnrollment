/*
  # Create Promo Codes Table

  ## Purpose
  This migration creates a table to store promotional discount codes that can be applied
  to enrollment orders. These codes provide fixed-amount discounts on the initial payment.

  ## Tables Created
  1. **promocodes**
    - `id` (uuid, primary key) - Unique identifier for each promo code
    - `code` (text, unique, not null) - The actual promo code string (e.g., "SAVE20")
    - `product` (text, not null) - Product identifier to match against enrollment products
    - `discount_amount` (numeric, not null) - Fixed dollar amount to subtract from initial payment
    - `active` (boolean, default true) - Whether the promo code can currently be used
    - `created_at` (timestamptz, default now()) - Timestamp when code was created
    - `updated_at` (timestamptz, default now()) - Timestamp when code was last modified

  ## Indexes
  - Unique index on `code` column for fast validation queries
  - Index on `active` column for filtering active codes

  ## Security
  - RLS enabled on the table
  - Public SELECT policy for active promo codes only (allows validation without authentication)
  - INSERT, UPDATE, DELETE restricted to authenticated users only (admin operations)

  ## Notes
  - Promo codes are case-insensitive (stored in uppercase)
  - Discount amounts are positive numbers representing dollars to subtract
  - Product field matches against enrollment form product identifiers
*/

-- Create promocodes table
CREATE TABLE IF NOT EXISTS promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  product text NOT NULL,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_promocodes_code ON promocodes (code);
CREATE INDEX IF NOT EXISTS idx_promocodes_active ON promocodes (active);

-- Enable Row Level Security
ALTER TABLE promocodes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active promo codes (needed for validation)
CREATE POLICY "Anyone can read active promo codes"
  ON promocodes
  FOR SELECT
  USING (active = true);

-- Only authenticated users can insert promo codes (admin operation)
CREATE POLICY "Authenticated users can insert promo codes"
  ON promocodes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update promo codes (admin operation)
CREATE POLICY "Authenticated users can update promo codes"
  ON promocodes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete promo codes (admin operation)
CREATE POLICY "Authenticated users can delete promo codes"
  ON promocodes
  FOR DELETE
  TO authenticated
  USING (true);