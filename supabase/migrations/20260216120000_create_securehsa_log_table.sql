/*
  # securehsa — enrollment API payload audit log

  Stores JSON snapshots of member payloads sent to the external enrollment API.
  `log` is TEXT (PostgreSQL limit ~1GB per row for practical use).
*/

CREATE TABLE IF NOT EXISTS public.securehsa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" timestamptz NOT NULL DEFAULT now(),
  log text NOT NULL
);

COMMENT ON TABLE public.securehsa IS 'Audit log of enrollment member payloads (enrollment-api-hsa)';
COMMENT ON COLUMN public.securehsa."date" IS 'When the log row was created';
COMMENT ON COLUMN public.securehsa.log IS 'JSON string of member payload sent to external API';

-- RLS on: anon/authenticated have no policies (no access). Service role bypasses RLS for Edge Functions.
ALTER TABLE public.securehsa ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_securehsa_date ON public.securehsa ("date" DESC);
