import { Dependent } from '../hooks/useEnrollmentStorage';

export const DEPENDENT_EMAIL_DUPLICATE_MESSAGE =
  'Your email address needs to be different from any other email addresses';

/**
 * If the email is a non-empty valid address and matches the subscriber or another dependent,
 * returns the duplicate message. Otherwise null (including empty or invalid format).
 */
export function getDependentEmailDuplicateError(
  email: string,
  dependentIndex: number,
  dependents: Dependent[],
  mainSubscriberEmail: string
): string | null {
  const trimmed = email.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }
  const lower = trimmed.toLowerCase();
  const mainLower = (mainSubscriberEmail || '').trim().toLowerCase();
  if (mainLower && lower === mainLower) {
    return DEPENDENT_EMAIL_DUPLICATE_MESSAGE;
  }
  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = dependents[i].email?.trim();
    if (other && other.toLowerCase() === lower) {
      return DEPENDENT_EMAIL_DUPLICATE_MESSAGE;
    }
  }
  return null;
}
