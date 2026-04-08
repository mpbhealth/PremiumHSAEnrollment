export function maskSSN(ssn: string): string {
  if (!ssn) return 'N/A';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-**-${digits.slice(-4)}`;
  }
  return '***-**-****';
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber) return 'N/A';
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `**** **** **** ${digits.slice(-4)}`;
  }
  return '**** **** **** ****';
}

export function maskRoutingNumber(routing: string): string {
  if (!routing) return 'N/A';
  const digits = routing.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `*****${digits.slice(-4)}`;
  }
  return '*****';
}

export function maskAccountNumber(account: string): string {
  if (!account) return 'N/A';
  const digits = account.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `*****${digits.slice(-4)}`;
  }
  return '*****';
}

export function maskTaxId(taxId: string): string {
  if (!taxId) return 'N/A';
  const digits = taxId.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `**-***${digits.slice(-4)}`;
  }
  return '**-****';
}

export function maskDigits(value: string, visibleCount = 4): string {
  if (!value) return 'N/A';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= visibleCount) return digits;
  const masked = '*'.repeat(digits.length - visibleCount);
  return `${masked}${digits.slice(-visibleCount)}`;
}
