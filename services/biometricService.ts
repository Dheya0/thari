import { NativeBiometric } from 'capacitor-native-biometric';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType?: string;
}

/**
 * Checks if Biometric authentication (Fingerprint / Face ID) is supported on the current device.
 */
export async function checkBiometricAvailable(): Promise<BiometricAvailability> {
  try {
    const res = await NativeBiometric.isAvailable();
    return {
      isAvailable: !!res.isAvailable,
      biometryType: res.biometryType ? String(res.biometryType) : 'Face ID / البصمة',
    };
  } catch (e) {
    // In Web browser or PWA with platform authenticator support (TouchID/FaceID)
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const isWebAuthnAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return {
          isAvailable: isWebAuthnAvailable,
          biometryType: 'Touch ID / Face ID',
        };
      } catch {
        return { isAvailable: false };
      }
    }
    return { isAvailable: false };
  }
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  isCancelled?: boolean;
}

/**
 * Prompts the user for biometric authentication (Face ID / Fingerprint).
 * Returns BiometricAuthResult with status details.
 */
export async function authenticateBiometrics(
  reason = 'يرجى تأكيد الهوية بالبصمة أو Face ID لدخول تطبيق ثري'
): Promise<BiometricAuthResult> {
  try {
    // 1. Try Native Capacitor Biometric first (iOS & Android)
    try {
      const status = await NativeBiometric.isAvailable();
      if (status && status.isAvailable) {
        await NativeBiometric.verifyIdentity({
          reason: reason,
          title: 'فتح تطبيق ثري بالبصمة',
          subtitle: 'تأكيد الأمان والحماية',
          description: 'استخدم بصمة الإبهام أو الوجه (Face ID) للفتح السريع',
        });
        return { success: true };
      }
    } catch (nativeErr: any) {
      console.warn('Native Biometrics prompt result:', nativeErr);
      const isCancel = nativeErr?.message?.toLowerCase().includes('cancel') || 
                       nativeErr?.code === 'USER_CANCELED' ||
                       nativeErr?.message?.includes('User canceled') ||
                       nativeErr?.message?.includes('13'); // Android cancellation code
      return { 
        success: false, 
        isCancelled: isCancel,
        error: isCancel ? 'تم إلغاء المسح بواسطة المستخدم' : 'تعذر التحقق من البصمة'
      };
    }

    // 2. WebAuthn Platform Authenticator for Mobile Safari / Chrome if registered
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (isAvailable) {
          const challenge = new Uint8Array(32);
          if (window.crypto) {
            window.crypto.getRandomValues(challenge);
          }
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 30000,
              userVerification: 'required',
              rpId: window.location.hostname || 'localhost',
              allowCredentials: [],
            }
          }).catch((err) => {
            console.warn('WebAuthn get error:', err);
            return null;
          });

          if (credential) {
            return { success: true };
          }
          return { success: false, error: 'لم تكتمل عملية التحقق' };
        }
      } catch (webErr: any) {
        console.warn('WebAuthn verification:', webErr);
        return { success: false, error: 'حدث خطأ أثناء فحص البصمة' };
      }
    }

    return { success: false, error: 'المستشعر الحيوي غير متاح حالياً' };
  } catch (err: any) {
    console.error('Biometric authentication error:', err);
    return { success: false, error: err?.message || 'فشل التحقق الحيوي' };
  }
}
