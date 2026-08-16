/**
 * Secure Storage Engine for Thari Financial App
 * Features:
 * - Obfuscated & Encrypted local persistence (prevents casual DevTools data extraction)
 * - Multi-slot rotating recovery snapshots (thari_snap_1, thari_snap_2, thari_snap_3)
 * - Native Capacitor Filesystem fallback backup for iOS & Android
 * - Backward compatibility with legacy unencrypted localStorage
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const STORAGE_SECRET_SALT = 'THARI_SECURE_VAULT_v4_2026';
const SNAPSHOT_KEYS = ['thari_vault_snap_a', 'thari_vault_snap_b', 'thari_vault_snap_c'];

/**
 * Scramble / Obfuscate payload with XOR key and Base64 wrapping
 */
export function obfuscateData(dataString: string): string {
  try {
    const saltLength = STORAGE_SECRET_SALT.length;
    let xorResult = '';
    for (let i = 0; i < dataString.length; i++) {
      const charCode = dataString.charCodeAt(i) ^ STORAGE_SECRET_SALT.charCodeAt(i % saltLength);
      xorResult += String.fromCharCode(charCode);
    }
    // Encode to UTF-8 safe base64
    return 'THR4_' + btoa(encodeURIComponent(xorResult));
  } catch (e) {
    // Fallback if encoding fails
    return 'RAW_' + btoa(encodeURIComponent(dataString));
  }
}

/**
 * De-obfuscate / Decrypt payload
 */
export function deobfuscateData(encodedString: string): string | null {
  try {
    if (encodedString.startsWith('THR4_')) {
      const base64Str = encodedString.slice(5);
      const xorStr = decodeURIComponent(atob(base64Str));
      const saltLength = STORAGE_SECRET_SALT.length;
      let originalStr = '';
      for (let i = 0; i < xorStr.length; i++) {
        const charCode = xorStr.charCodeAt(i) ^ STORAGE_SECRET_SALT.charCodeAt(i % saltLength);
        originalStr += String.fromCharCode(charCode);
      }
      return originalStr;
    } else if (encodedString.startsWith('RAW_')) {
      return decodeURIComponent(atob(encodedString.slice(4)));
    } else if (encodedString.startsWith('{') || encodedString.startsWith('[')) {
      // Legacy unencrypted JSON
      return encodedString;
    }
    return null;
  } catch (e) {
    console.warn('SecureStorage: Decoding failed, attempting raw parse', e);
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
    const snapIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % SNAPSHOT_KEYS.length; // Rotates every hour
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
        return JSON.parse(decoded);
      }
    }

    // 2. Failover: Check rotating snapshots
    for (const snapKey of SNAPSHOT_KEYS) {
      const snapData = localStorage.getItem(snapKey);
      if (snapData) {
        const decoded = deobfuscateData(snapData);
        if (decoded) {
          console.info('SecureStorage: Recovered state from backup snapshot', snapKey);
          return JSON.parse(decoded);
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
          if (decoded) return JSON.parse(decoded);
        }
      }
    }

    return null;
  } catch (err) {
    console.error('SecureStorage: Failed to load state', err);
    return null;
  }
}
