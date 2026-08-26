/**
 * Secure Storage Engine for Thari Financial App
 * Uses OS-backed keychain/keystore when available and refuses to store data in unsafe plaintext fallbacks.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const STORAGE_SECRET_SALT = 'THARI_SECURE_VAULT_v4_2026';
const SNAPSHOT_KEYS = ['thari_vault_snap_a', 'thari_vault_snap_b', 'thari_vault_snap_c'];
const V2_PREFIX = 'THARI_AES_GCM_V2:';
let cachedDeviceSecret: string | null = null;

function getCrypto(): Crypto | null {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto;
  }
  if (typeof crypto !== 'undefined' && (crypto as any).subtle) {
    return crypto as unknown as Crypto;
  }
  return null;
}

async function tryLoadNativeSecureSecret(): Promise<string | null> {
  try {
    const cap: any = (await import('@capacitor/core')).Capacitor;
    if (!cap || !(cap.isNativePlatform && cap.isNativePlatform())) {
      return null;
    }

    const dynamicImport = (m: string) => (new Function('m', 'return import(m)'))(m);

    const pluginCandidates = [
      ['@capacitor-community/secure-storage', 'secureStorage'],
      ['@capacitor/keychain', 'keychain'],
    ];

    for (const [moduleName, pluginName] of pluginCandidates) {
      try {
        const mod = await dynamicImport(moduleName);
        const plugin: any = mod && (mod[pluginName] || mod.default || mod.SecureStorage || mod.Keychain || mod);
        if (plugin && typeof plugin.get === 'function') {
          const result = await plugin.get({ key: 'thari_device_secret' });
          const value = result && (result.value ?? result.secret ?? result.data ?? result)
          if (typeof value === 'string' && value.length > 0) {
            return value;
          }
        }
      } catch {
        // Plugin is not installed or absent for this platform.
      }
    }

    const plugins = (cap as any).Plugins || (cap as any);
    for (const pluginName of ['SecureStorage', 'Keychain', 'Preferences']) {
      const plugin: any = plugins && plugins[pluginName];
      if (plugin && typeof plugin.get === 'function') {
        try {
          const result = await plugin.get({ key: 'thari_device_secret' });
          const value = result && (result.value ?? result.secret ?? result.data ?? result);
          if (typeof value === 'string' && value.length > 0) {
            return value;
          }
        } catch {
          // ignore and keep trying
        }
      }
    }
  } catch {
    // ignore plugin import errors
  }

  return null;
}

/**
 * Obtain a device-bound secret from native Keychain/Keystore.
 * If no secure storage backend exists, we intentionally fail closed instead of storing a plaintext secret on disk.
 */
async function getDeviceSecret(): Promise<string> {
  if (cachedDeviceSecret) return cachedDeviceSecret;

  const nativeSecret = await tryLoadNativeSecureSecret();
  if (nativeSecret) {
    cachedDeviceSecret = nativeSecret;
    return cachedDeviceSecret;
  }

  throw new Error('Secure device keystore unavailable. Refusing to persist financial state without native secure storage.');
}

function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function base64ToUtf8(base64: string): string {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return decodeURIComponent(escape(atob(base64)));
  }
}

function base64ToUint8Array(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoImpl = getCrypto();
  if (!cryptoImpl) {
    throw new Error('Web Crypto API unavailable');
  }

  const keyMaterial = await cryptoImpl.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const saltCopy = new Uint8Array(salt.length);
  saltCopy.set(salt);
  const saltBuffer = saltCopy.buffer as ArrayBuffer;

  return cryptoImpl.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptWithAesGcm(dataString: string): Promise<string> {
  const cryptoImpl = getCrypto();
  if (!cryptoImpl) {
    throw new Error('Web Crypto API unavailable');
  }

  const salt = cryptoImpl.getRandomValues(new Uint8Array(16));
  const iv = cryptoImpl.getRandomValues(new Uint8Array(12));
  const deviceSecret = await getDeviceSecret();
  const key = await deriveKey(deviceSecret, salt);
  const encoded = new TextEncoder().encode(dataString);
  const encrypted = await cryptoImpl.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const payload = concatBytes([salt, iv, new Uint8Array(encrypted)]);
  return V2_PREFIX + uint8ArrayToBase64(payload);
}

async function decryptWithAesGcm(encodedString: string): Promise<string> {
  if (!encodedString.startsWith(V2_PREFIX)) {
    throw new Error('Not AES V2 payload');
  }

  const cryptoImpl = getCrypto();
  if (!cryptoImpl) {
    throw new Error('Web Crypto API unavailable');
  }

  const blob = base64ToUint8Array(encodedString.slice(V2_PREFIX.length));
  if (blob.length < 28) {
    throw new Error('Invalid encrypted payload');
  }

  const salt = blob.slice(0, 16);
  const iv = blob.slice(16, 28);
  const cipherText = blob.slice(28);
  const deviceSecret = await getDeviceSecret();
  const key = await deriveKey(deviceSecret, salt);
  const decrypted = await cryptoImpl.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);
  return new TextDecoder().decode(decrypted);
}

export function obfuscateData(dataString: string): string {
  try {
    const saltLength = STORAGE_SECRET_SALT.length;
    const b64 = utf8ToBase64(dataString);
    let xorResult = '';
    for (let i = 0; i < b64.length; i++) {
      const charCode = b64.charCodeAt(i) ^ STORAGE_SECRET_SALT.charCodeAt(i % saltLength);
      xorResult += String.fromCharCode(charCode);
    }
    return 'THR4_' + btoa(xorResult);
  } catch (e) {
    return 'RAW_' + utf8ToBase64(dataString);
  }
}

export function deobfuscateData(encodedString: string): string | null {
  try {
    if (encodedString.startsWith('THR4_')) {
      const xorStr = atob(encodedString.slice(5));
      const saltLength = STORAGE_SECRET_SALT.length;
      let b64 = '';
      for (let i = 0; i < xorStr.length; i++) {
        const charCode = xorStr.charCodeAt(i) ^ STORAGE_SECRET_SALT.charCodeAt(i % saltLength);
        b64 += String.fromCharCode(charCode);
      }
      return base64ToUtf8(b64);
    } else if (encodedString.startsWith('RAW_')) {
      return base64ToUtf8(encodedString.slice(4));
    } else if (encodedString.startsWith('{') || encodedString.startsWith('[')) {
      return encodedString;
    }
    return null;
  } catch (e) {
    if (encodedString.startsWith('{') || encodedString.startsWith('[')) {
      return encodedString;
    }
    return null;
  }
}

export async function writeEncryptedValue(primaryKey: string, value: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Secure persistence is unavailable in a non-native runtime. Refusing to store financial state insecurely.');
  }

  const encryptedData = await encryptWithAesGcm(value);
  localStorage.setItem(primaryKey, encryptedData);

  const snapIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % SNAPSHOT_KEYS.length;
  const targetSnapKey = SNAPSHOT_KEYS[snapIndex];
  localStorage.setItem(targetSnapKey, encryptedData);
  localStorage.setItem('thari_last_save_ts', Date.now().toString());
}

export function saveSecureStateSync(primaryKey: string, stateObj: any): void {
  try {
    if (!stateObj) return;
    const jsonStr = JSON.stringify(stateObj);

    void (async () => {
      try {
        await writeEncryptedValue(primaryKey, jsonStr);
      } catch (err) {
        console.warn('SecureStorage: secure persistence unavailable in this environment; skipping write.', err);
      }
    })();
  } catch (err) {
    console.error('SecureStorage: Error in sync state save', err);
  }
}

export async function saveSecureState(primaryKey: string, stateObj: any): Promise<void> {
  try {
    if (!stateObj) return;
    const jsonStr = JSON.stringify(stateObj);

    try {
      await writeEncryptedValue(primaryKey, jsonStr);
    } catch (quotaErr) {
      console.warn('SecureStorage: secure persistence failed, clearing snapshots and retrying...', quotaErr);
      for (const key of SNAPSHOT_KEYS) {
        try { localStorage.removeItem(key); } catch {}
      }
      try {
        await writeEncryptedValue(primaryKey, jsonStr);
      } catch (retryErr) {
        console.warn('SecureStorage: secure persistence unavailable; skipping state save.', retryErr);
      }
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: 'thari_data_vault.enc',
          data: await encryptWithAesGcm(jsonStr),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
      } catch (nativeErr) {
        console.warn('SecureStorage: native vault write unavailable; continuing in memory only.', nativeErr);
      }
    }
  } catch (err) {
    console.error('SecureStorage: Error saving state', err);
  }
}

export async function loadSecureStateAsync(primaryKey: string): Promise<any | null> {
  try {
    const keysToCheck = [primaryKey, ...SNAPSHOT_KEYS, 'thari_app_v4', 'thari_backup_snapshot', 'thari_app_state'];
    for (const key of keysToCheck) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      if (raw.startsWith(V2_PREFIX)) {
        try {
          const decrypted = await decryptWithAesGcm(raw);
          return JSON.parse(decrypted);
        } catch {
          continue;
        }
      }

      // Ignore legacy-obfuscated or plaintext app state. These formats are considered insecure and are removed on read.
      if (raw.startsWith('THR4_') || raw.startsWith('RAW_') || raw.startsWith('{') || raw.startsWith('[')) {
        try {
          localStorage.removeItem(key);
          if (key !== primaryKey) {
            // Best effort cleanup for stale archive copies
            for (const candidate of SNAPSHOT_KEYS) {
              if (candidate !== key) {
                try { localStorage.removeItem(candidate); } catch {}
              }
            }
          }
        } catch {}
      }
    }

    return null;
  } catch (err) {
    console.error('SecureStorage: Failed to load state', err);
    return null;
  }
}

export function loadSecureState(primaryKey: string): any | null {
  try {
    const keysToCheck = [primaryKey, ...SNAPSHOT_KEYS, 'thari_app_v4', 'thari_backup_snapshot', 'thari_app_state'];
    for (const key of keysToCheck) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      if (raw.startsWith(V2_PREFIX)) {
        return null;
      }
      if (raw.startsWith('THR4_') || raw.startsWith('RAW_') || raw.startsWith('{') || raw.startsWith('[')) {
        try { localStorage.removeItem(key); } catch {}
      }
    }
    return null;
  } catch (err) {
    console.error('SecureStorage: Failed to load state', err);
    return null;
  }
}
