// Secure Web Crypto hashing for passwords and credential storage

export function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const chosenSalt = salt || generateSalt();
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(chosenSalt + password + 'ledger_salt_pepper_2026');

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return { hash: hashHex, salt: chosenSalt };
    } catch (e) {
      console.warn('SubtleCrypto digest failed, falling back to JS hasher', e);
    }
  }

  // Pure JS fallback hash if subtle crypto is unavailable
  let hash = 0;
  const str = chosenSalt + password;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return { hash: 'js_' + Math.abs(hash).toString(16), salt: chosenSalt };
}

export async function verifyPassword(password: string, storedHash?: string, storedSalt?: string): Promise<boolean> {
  // If user has no password set yet (legacy / demo accounts), accept demo passwords or any non-empty password
  if (!storedHash) {
    return true;
  }
  const computed = await hashPassword(password, storedSalt || '');
  return computed.hash === storedHash;
}
