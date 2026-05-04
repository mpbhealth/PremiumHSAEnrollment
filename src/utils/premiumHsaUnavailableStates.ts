/**
 * Primary subscriber states where Premium HSA enrollment is not offered.
 * Keep codes uppercase to match `<select name="state">` values.
 */
export const PREMIUM_HSA_UNAVAILABLE_STATES = [
  'WA',
  'VT',
  'PA',
  'NM',
  'CA',
  'MD',
  'MT',
  'FL',
] as const;

const UNAVAILABLE = new Set<string>(PREMIUM_HSA_UNAVAILABLE_STATES);

export function isPremiumHsaUnavailableState(stateCode: string): boolean {
  const trimmed = stateCode.trim();
  if (!trimmed) return false;
  return UNAVAILABLE.has(trimmed.toUpperCase());
}

export const PREMIUM_HSA_UNAVAILABLE_STATE_MESSAGE = 'Premium HSA not available in your state';
