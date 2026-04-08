export const formatPhoneNumber = (value: string, previousValue?: string): string => {
  const digits = value.replace(/\D/g, '');
  const prevDigits = previousValue?.replace(/\D/g, '') || '';

  const isDeleting = value.length < (previousValue?.length || 0);

  if (digits.length === 0) {
    return '';
  } else if (digits.length < 3) {
    return digits;
  } else if (digits.length === 3) {
    return isDeleting ? digits : `${digits}-`;
  } else if (digits.length < 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length === 6) {
    return isDeleting ? `${digits.slice(0, 3)}-${digits.slice(3)}` : `${digits.slice(0, 3)}-${digits.slice(3)}-`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

export const formatSSN = (value: string, previousValue?: string): string => {
  const digits = value.replace(/\D/g, '');
  const prevDigits = previousValue?.replace(/\D/g, '') || '';

  const isDeleting = value.length < (previousValue?.length || 0);

  if (digits.length === 0) {
    return '';
  } else if (digits.length < 3) {
    return digits;
  } else if (digits.length === 3) {
    return isDeleting ? digits : `${digits}-`;
  } else if (digits.length < 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length === 5) {
    return isDeleting ? `${digits.slice(0, 3)}-${digits.slice(3)}` : `${digits.slice(0, 3)}-${digits.slice(3)}-`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }
};

export const formatDOB = (value: string, previousValue?: string): string => {
  const digits = value.replace(/\D/g, '');
  const prevDigits = previousValue?.replace(/\D/g, '') || '';

  const isDeleting = value.length < (previousValue?.length || 0);

  if (digits.length === 0) {
    return '';
  } else if (digits.length < 2) {
    return digits;
  } else if (digits.length === 2) {
    return isDeleting ? digits : `${digits}/`;
  } else if (digits.length < 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else if (digits.length === 4) {
    return isDeleting ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2)}/`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

export const extractProductIdFromDropdown = (displayText: string): string | null => {
  const match = displayText.match(/\((\d+)\)$/);
  return match ? match[1] : null;
};

export const extractPriceFromDropdown = (displayText: string): number | null => {
  const match = displayText.match(/\$(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
};
