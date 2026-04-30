import { Dependent } from '../hooks/useEnrollmentStorage';

export const DEPENDENT_PHONE_DUPLICATE_MESSAGE =
  'Your phone number needs to be different from any other phone numbers';

export const DEPENDENT_SSN_DUPLICATE_MESSAGE =
  'Your Social Security number needs to be different from any other Social Security numbers';

export function stripDigits(value: string): string {
  return (value ?? '').trim().replace(/\D/g, '');
}

export function getDependentPhoneDuplicateError(
  phone: string,
  dependentIndex: number,
  dependents: Dependent[],
  mainSubscriberPhone: string
): string | null {
  const digits = stripDigits(phone);
  if (digits.length !== 10) return null;

  const mainDigits = stripDigits(mainSubscriberPhone);
  if (mainDigits.length === 10 && digits === mainDigits) {
    return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
  }

  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = stripDigits(dependents[i].phone || '');
    if (other.length === 10 && other === digits) {
      return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

export function getDependentSsnDuplicateError(
  ssn: string,
  dependentIndex: number,
  dependents: Dependent[],
  mainSubscriberSsn: string
): string | null {
  const digits = stripDigits(ssn);
  if (digits.length !== 9) return null;

  const mainDigits = stripDigits(mainSubscriberSsn);
  if (mainDigits.length === 9 && digits === mainDigits) {
    return DEPENDENT_SSN_DUPLICATE_MESSAGE;
  }

  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = stripDigits(dependents[i].ssn || '');
    if (other.length === 9 && other === digits) {
      return DEPENDENT_SSN_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

export function getPrimarySubscriberPhoneDuplicateError(
  phone: string,
  dependents: Dependent[]
): string | null {
  const digits = stripDigits(phone);
  if (digits.length !== 10) return null;

  for (let i = 0; i < dependents.length; i++) {
    const other = stripDigits(dependents[i].phone || '');
    if (other.length === 10 && other === digits) {
      return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

export function getPrimarySubscriberSsnDuplicateError(
  ssn: string,
  dependents: Dependent[]
): string | null {
  const digits = stripDigits(ssn);
  if (digits.length !== 9) return null;

  for (let i = 0; i < dependents.length; i++) {
    const other = stripDigits(dependents[i].ssn || '');
    if (other.length === 9 && other === digits) {
      return DEPENDENT_SSN_DUPLICATE_MESSAGE;
    }
  }
  return null;
}
