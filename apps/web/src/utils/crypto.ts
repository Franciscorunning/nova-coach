/**
 * Browser-compatible AES-256-GCM encryption utilities using Web Crypto API.
 *
 * NOTE: The encryption key is derived from VITE_ENCRYPTION_KEY (a 64-char hex
 * string = 32 bytes). In production, sensitive token operations such as token
 * exchange and storage should be performed in a server-side component (e.g.,
 * a Supabase Edge Function) to avoid exposing the key in the browser bundle.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: "<iv_hex>:<ciphertext_with_tag_hex>"
 */
export async function encrypt(plaintext: string): Promise<string> {
  const keyHex = import.meta.env.VITE_ENCRYPTION_KEY || '';
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getKey(keyHex);
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    encoded
  );
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(encrypted))}`;
}

/**
 * Decrypts a string previously encrypted with {@link encrypt}.
 * Expects format: "<iv_hex>:<ciphertext_with_tag_hex>"
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const keyHex = import.meta.env.VITE_ENCRYPTION_KEY || '';
  const colonIdx = encryptedData.indexOf(':');
  if (colonIdx === -1) throw new Error('Invalid encrypted data format');
  const iv = hexToBytes(encryptedData.slice(0, colonIdx));
  const ciphertext = hexToBytes(encryptedData.slice(colonIdx + 1));
  const key = await getKey(keyHex);
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv: iv.buffer as ArrayBuffer }, key, ciphertext.buffer as ArrayBuffer);
  return new TextDecoder().decode(decrypted);
}

/**
 * Generates a cryptographically secure random hex token.
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bytesToHex(bytes);
}
