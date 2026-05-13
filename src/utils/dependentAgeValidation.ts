import { Dependent } from '../hooks/useEnrollmentStorage';
import { calculateAgeFromDOB } from './pricingLogic';

/**
 * True when the dependent is a `Child` whose age is computable and strictly < 18.
 *
 * Used in the client to relax the email/phone/SSN "required" rule on Step 3 for
 * minor children. If the DOB is missing/malformed (`calculateAgeFromDOB` returns
 * `null`), this returns `false` so the full required rules still apply — that is
 * the safe default. Spouses and adult children (>= 18) always return `false`.
 *
 * Keep in sync with any future per-relationship child rules on the server
 * (`supabase/functions/enrollment-api-premiumhsa/index.ts`). Today that Edge
 * function does not require per-dependent EMAIL/PHONE1/SSN, so this is a
 * pure client relaxation.
 */
export function isChildDependentUnder18ForContactOptional(
  dob: string,
  relationship: Dependent['relationship']
): boolean {
  if (relationship !== 'Child') return false;
  const age = calculateAgeFromDOB(dob);
  return age !== null && age < 18;
}
