interface SensitiveFields {
  ssn: string;
  payment: {
    ccType: string;
    ccNumber: string;
    ccExpMonth: string;
    ccExpYear: string;
    achrouting: string;
    achaccount: string;
    achbank: string;
    paymentType: string;
    paymentMethod: string;
  };
  questionnaireAnswers: Record<string, unknown>;
  dependentSsns: string[];
  dependentPhones: string[];
  dependentEmails: string[];
  dependentDobs: string[];
  benefitId: string;
  pdid: unknown;
  phone: string;
  email: string;
  agent: string;
  dob: string;
  city: string;
  appliedPromo: unknown;
}

interface EncryptedBlock {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
}

export type EncryptedPayload = Record<string, unknown> & {
  _encrypted: EncryptedBlock;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRsaPublicKey(): Promise<CryptoKey> {
  const publicKeyBase64 = import.meta.env.VITE_RSA_PUBLIC_KEY;
  if (!publicKeyBase64) {
    throw new Error('RSA public key not configured');
  }

  const keyBuffer = base64ToArrayBuffer(publicKeyBase64);

  return crypto.subtle.importKey(
    'spki',
    keyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  );
}

function extractSensitiveFields(payload: Record<string, unknown>): SensitiveFields {
  const payment = payload.payment as Record<string, string> | undefined;
  const questionnaire = payload.questionnaireAnswers as Record<string, unknown> | undefined;
  const dependents = payload.dependents as Array<Record<string, unknown>> | undefined;

  return {
    ssn: (payload.ssn as string) || '',
    payment: {
      ccType: payment?.ccType || '',
      ccNumber: payment?.ccNumber || '',
      ccExpMonth: payment?.ccExpMonth || '',
      ccExpYear: payment?.ccExpYear || '',
      achrouting: payment?.achrouting || '',
      achaccount: payment?.achaccount || '',
      achbank: payment?.achbank || '',
      paymentType: payment?.paymentType || '',
      paymentMethod: payment?.paymentMethod || '',
    },
    questionnaireAnswers: questionnaire ? { ...questionnaire } : {},
    dependentSsns: dependents
      ? dependents.map(dep => (dep.ssn as string) || '')
      : [],
    dependentPhones: dependents
      ? dependents.map(dep => (dep.phone as string) || '')
      : [],
    dependentEmails: dependents
      ? dependents.map(dep => (dep.email as string) || '')
      : [],
    dependentDobs: dependents
      ? dependents.map(dep => (dep.dob as string) || '')
      : [],
    benefitId: (payload.benefitId as string) || '',
    pdid: payload.pdid ?? null,
    phone: (payload.phone as string) || '',
    email: (payload.email as string) || '',
    agent: (payload.agent as string) || '',
    dob: (payload.dob as string) || '',
    city: (payload.city as string) || '',
    appliedPromo: payload.appliedPromo ?? null,
  };
}

function stripSensitiveFields(payload: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...payload };

  stripped.ssn = '[encrypted]';

  if (stripped.payment && typeof stripped.payment === 'object') {
    const payment = stripped.payment as Record<string, unknown>;
    stripped.payment = {
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      ccType: '',
      ccNumber: '',
      ccExpMonth: '',
      ccExpYear: '',
      achrouting: '',
      achaccount: '',
      achbank: '',
    };
  }

  stripped.questionnaireAnswers = {};

  if (Array.isArray(stripped.dependents)) {
    stripped.dependents = (stripped.dependents as Array<Record<string, unknown>>).map(dep => ({
      ...dep,
      ssn: '[encrypted]',
      phone: '[encrypted]',
      email: '[encrypted]',
      dob: '[encrypted]',
    }));
  }

  stripped.benefitId = '[encrypted]';
  stripped.pdid = 0;
  stripped.phone = '[encrypted]';
  stripped.email = '[encrypted]';
  stripped.agent = '[encrypted]';
  stripped.dob = '[encrypted]';
  stripped.city = '[encrypted]';
  stripped.appliedPromo = null;

  return stripped;
}

export async function encryptSensitiveFields(
  payload: Record<string, unknown>
): Promise<EncryptedPayload> {
  const sensitiveData = extractSensitiveFields(payload);
  const encoded = new TextEncoder().encode(JSON.stringify(sensitiveData));

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );

  const rsaPublicKey = await importRsaPublicKey();

  const wrappedKey = await crypto.subtle.wrapKey(
    'raw',
    aesKey,
    rsaPublicKey,
    { name: 'RSA-OAEP' }
  );

  const strippedPayload = stripSensitiveFields(payload);

  return {
    ...strippedPayload,
    _encrypted: {
      encryptedData: arrayBufferToBase64(ciphertext),
      encryptedKey: arrayBufferToBase64(wrappedKey),
      iv: arrayBufferToBase64(iv.buffer),
    },
  };
}
