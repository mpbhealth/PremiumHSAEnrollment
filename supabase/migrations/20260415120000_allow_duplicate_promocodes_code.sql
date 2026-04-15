/*
  Allow duplicate `code` values on promocodes.

  Drops the column UNIQUE constraint (and its index) and the explicitly named
  unique index from the original migration, then recreates a non-unique index
  for lookup performance.
*/

ALTER TABLE promocodes DROP CONSTRAINT IF EXISTS promocodes_code_key;

DROP INDEX IF EXISTS idx_promocodes_code;

CREATE INDEX IF NOT EXISTS idx_promocodes_code ON promocodes (code);
