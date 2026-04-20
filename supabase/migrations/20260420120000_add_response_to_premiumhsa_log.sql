/*
  # PremiumHsa_log — store external API JSON response

  `response` holds the JSON body returned from the enrollment API (e.g. SUCCESS, MESSAGES).
*/

ALTER TABLE public."PremiumHsa_log"
  ADD COLUMN IF NOT EXISTS response text;

COMMENT ON COLUMN public."PremiumHsa_log".response IS 'JSON string of external API response (SUCCESS, MESSAGES, etc.)';
