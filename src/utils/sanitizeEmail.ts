export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function createPDFFilename(email: string): string {
  const sanitized = sanitizeEmail(email);
  return `${sanitized}.pdf`;
}
