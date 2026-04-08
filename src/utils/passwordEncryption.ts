import CryptoJS from 'crypto-js';

const getSecretKey = (): string => {
  const key = import.meta.env.VITE_ENCRYPTION_SECRET_KEY;
  if (!key) {
    throw new Error('VITE_ENCRYPTION_SECRET_KEY is not defined in environment variables');
  }
  return key;
};

export const encryptPassword = (password: string): string => {
  try {
    const secretKey = getSecretKey();
    const encrypted = CryptoJS.AES.encrypt(password, secretKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
};

export const decryptPassword = (encryptedPassword: string): string => {
  try {
    const secretKey = getSecretKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
    const originalPassword = decrypted.toString(CryptoJS.enc.Utf8);

    if (!originalPassword) {
      throw new Error('Decryption resulted in empty string');
    }

    return originalPassword;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
};

export const testEncryption = (password: string): { encrypted: string; decrypted: string; matches: boolean } => {
  const encrypted = encryptPassword(password);
  const decrypted = decryptPassword(encrypted);
  return {
    encrypted,
    decrypted,
    matches: password === decrypted
  };
};
