/**
 * Secure Storage Engine for Thari Financial App
 * UTF-8 Safe Obfuscation and Multi-Slot Recovery
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const STORAGE_SECRET_SALT = 'THARI_SECURE_VAULT_v4_2026';
const SNAPSHOT_KEYS = ['thari_vault_snap_a', 'thari_vault_snap_b', 'thari_vault_snap_c'];

/**
 * UTF-8 Safe Base64 Encoding
 */
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

/**
 * UTF-8 Safe Base64 Decoding
 */
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

/**
 * Scramble / Obfuscate payload with XOR key and UTF-8 Base64 wrapping
 */
export function obfuscateData(dataString: string): string {
  try {
    const saltLength = STORAGE_SECRET_SALT.length;
    // Step 1: convert text to safe base64
    const b64 = utf8ToBase64(dataString);
    // Step 2: XOR scramble the base64 ascii chars
    let xorResult = '';
    for (let i = 0; i < b64.length; i++) {
      const charCode = b64.charCodeAt(i) ^ STORAGE_SECRET_SALT.charCodeAt(i % saltLength);
      xorResult += String.fromCharCode(charCode);
    }
    return 'THR4_' + btoa(xorResult);
  } catch (e) {
    // Fallback if encoding fails
    return 'RAW_' + utf8ToBase64(dataString);
  }
}

/**
 * De-obfuscate / Decrypt payload
 */
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
      // Legacy unencrypted JSON
      return encodedString;
    }
    return null;
  } catch (e) {
    // Graceful fallback: try parsing as raw json
    if (encodedString.startsWith('{') || encodedString.startsWith('[')) {
      return encodedString;
    }
    return null;
  }
}

/**
 * Save application state securely with rotating snapshots
 */
export async function saveSecureState(primaryKey: string, stateObj: any): Promise<void> {
  try {
    const jsonStr = JSON.stringify(stateObj);
    const encryptedData = obfuscateData(jsonStr);

    // 1. Primary write
    localStorage.setItem(primaryKey, encryptedData);

    // 2. Rotating Snapshot
    const snapIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % SNAPSHOT_KEYS.length;
    const targetSnapKey = SNAPSHOT_KEYS[snapIndex];
    localStorage.setItem(targetSnapKey, encryptedData);
    localStorage.setItem('thari_last_save_ts', Date.now().toString());

    // 3. Native Mobile Storage (iOS & Android File Vault)
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: 'thari_data_vault.enc',
          data: encryptedData,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
      } catch (nativeErr) {
        // Silent catch for native write
      }
    }
  } catch (err) {
    console.error('SecureStorage: Error saving state', err);
  }
}

/**
 * Load application state safely with failover snapshots
 */
export function loadSecureState(primaryKey: string): any | null {
  try {
    // 1. Try Primary Key
    const primaryData = localStorage.getItem(primaryKey);
    if (primaryData) {
      const decoded = deobfuscateData(primaryData);
      if (decoded) {
        try {
          return JSON.parse(decoded);
        } catch {}
      }
    }

    // 2. Failover: Check rotating snapshots
    for (const snapKey of SNAPSHOT_KEYS) {
      const snapData = localStorage.getItem(snapKey);
      if (snapData) {
        const decoded = deobfuscateData(snapData);
        if (decoded) {
          try {
            return JSON.parse(decoded);
          } catch {}
        }
      }
    }

    // 3. Check legacy raw keys
    const legacyKeys = ['thari_app_v4', 'thari_backup_snapshot', 'thari_app_state'];
    for (const lk of legacyKeys) {
      const legacyData = localStorage.getItem(lk);
      if (legacyData) {
        try {
          return JSON.parse(legacyData);
        } catch {
          const decoded = deobfuscateData(legacyData);
          if (decoded) {
            try {
              return JSON.parse(decoded);
            } catch {}
          }
        }
      }
    }

    return null;
  } catch (err) {
    console.error('SecureStorage: Failed to load state', err);
    return null;
  }
}
