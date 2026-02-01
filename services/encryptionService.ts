
/**
 * خدمة تشفير متقدمة باستخدام Web Crypto API (AES-256-GCM).
 * Advanced Encryption Standard (AES) - Galois/Counter Mode (GCM).
 * 
 * الميزات:
 * 1. آمنة مشفراً (Cryptographically Secure).
 * 2. تعمل أوفلاين 100% (Native Browser API).
 * 3. حماية ضد التلاعب (Authenticated Encryption).
 */

const ENCODING = new TextEncoder();
const DECODING = new TextDecoder();

// تحويل ArrayBuffer إلى Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// تحويل Base64 إلى ArrayBuffer
const base64ToBuffer = (base64: string): Uint8Array => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

// دمج مصفوفات البايت
const concatBuffers = (buffers: Uint8Array[]): Uint8Array => {
    let totalLength = 0;
    for (const b of buffers) totalLength += b.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
        result.set(b, offset);
        offset += b.length;
    }
    return result;
};

/**
 * اشتقاق مفتاح التشفير من كلمة المرور باستخدام PBKDF2
 */
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        ENCODING.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    
    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, // معيار قوي للأمان
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
};

/**
 * تشفير البيانات باستخدام AES-256-GCM
 */
export const encryptData = async (data: string, password: string): Promise<string> => {
    try {
        // 1. توليد قيم عشوائية آمنة
        const salt = window.crypto.getRandomValues(new Uint8Array(16)); // 16 bytes for PBKDF2
        const iv = window.crypto.getRandomValues(new Uint8Array(12));   // 12 bytes for AES-GCM IV

        // 2. اشتقاق المفتاح
        const key = await deriveKey(password, salt);

        // 3. تشفير البيانات
        // Web Crypto API يضيف AuthTag تلقائياً في نهاية الـ CipherText في وضع GCM
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ENCODING.encode(data)
        );

        // 4. دمج النتائج: Salt + IV + CipherText(+AuthTag)
        const finalBuffer = concatBuffers([
            salt,
            iv,
            new Uint8Array(encryptedContent)
        ]);

        // 5. التحويل إلى Base64 للحفظ
        return "THARI_AES_GCM:" + bufferToBase64(finalBuffer.buffer);

    } catch (e) {
        console.error("AES Encryption Failed:", e);
        throw new Error("فشل التشفير الآمن. يرجى المحاولة مرة أخرى.");
    }
};

/**
 * فك تشفير البيانات
 */
export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
    try {
        // --- دعم النسخ القديمة (Backward Compatibility) ---
        if (encryptedData.startsWith("{") || encryptedData.startsWith("[")) return encryptedData; // JSON عادي
        
        // دعم التشفير القديم (XOR) لضمان عدم فقدان البيانات القديمة
        if (encryptedData.startsWith("THARI_V3:") || encryptedData.startsWith("THARI_SECURE_V2:")) {
            return decryptLegacyXOR(encryptedData, password);
        }
        
        if (encryptedData.startsWith("THARI_AES_GCM:")) {
            const rawBase64 = encryptedData.replace("THARI_AES_GCM:", "");
            const fullBuffer = base64ToBuffer(rawBase64);

            // استخراج الأجزاء: Salt (16) | IV (12) | CipherText (Rest)
            const salt = fullBuffer.slice(0, 16);
            const iv = fullBuffer.slice(16, 28);
            const cipherText = fullBuffer.slice(28);

            // اشتقاق المفتاح (يجب أن ينتج نفس المفتاح إذا كانت كلمة المرور صحيحة)
            const key = await deriveKey(password, salt);

            // فك التشفير
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                cipherText
            );

            return DECODING.decode(decryptedBuffer);
        }

        throw new Error("تنسيق الملف غير مدعوم");

    } catch (e) {
        console.error("Decryption Failed:", e);
        throw new Error("كلمة المرور غير صحيحة أو الملف تالف");
    }
};

// --- Legacy Decryption Helper (للنسخ القديمة فقط) ---
const decryptLegacyXOR = (encryptedData: string, password: string): string => {
    // دوال مساعدة محلية للنسخة القديمة
    const fromBase64 = (s: string) => decodeURIComponent(escape(window.atob(s)));
    const xor = (txt: string, pass: string) => {
        let r = ''; for(let i=0;i<txt.length;i++) r += String.fromCharCode(txt.charCodeAt(i) ^ pass.charCodeAt(i % pass.length)); return r;
    };
    
    let payload = encryptedData.replace(/THARI_V\d+:/, "").replace("THARI_SECURE_V2:", "");
    try {
        const xored = fromBase64(payload);
        const jsonStr = fromBase64(xor(xored, password));
        const parsed = JSON.parse(jsonStr);
        return parsed.content || parsed.d || jsonStr;
    } catch {
        throw new Error("كلمة المرور خاطئة (نظام قديم)");
    }
};
