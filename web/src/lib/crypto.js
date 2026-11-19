// 🔐 Web Crypto API End-to-End Encryption (E2EE) Module
// Uses ECDH (Curve P-256) for Key Exchange + AES-GCM (256-bit) for Message Encryption

const DB_KEY = "enclave_e2ee_keypair";
const SHARED_KEYS_CACHE = new Map(); // targetUserId -> CryptoKey

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 1. Generate or retrieve existing ECDH keypair from localStorage
export async function getOrCreateKeyPair() {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        parsed.privateKey,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        parsed.publicKey,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );
      return { keyPair: { privateKey, publicKey }, publicJwk: parsed.publicKey };
    }

    // Generate new ECDH keypair
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );

    const exportedPrivate = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const exportedPublic = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

    localStorage.setItem(
      DB_KEY,
      JSON.stringify({ privateKey: exportedPrivate, publicKey: exportedPublic })
    );

    return { keyPair, publicJwk: exportedPublic };
  } catch (err) {
    console.error("[E2EE Crypto] Error initializing keypair:", err);
    return null;
  }
}

// 2. Import recipient's public key (from JWK string or object)
export async function importPublicKey(jwkData) {
  try {
    const jwk = typeof jwkData === "string" ? JSON.parse(jwkData) : jwkData;
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  } catch (err) {
    console.warn("[E2EE Crypto] Failed to import recipient public key:", err.message);
    return null;
  }
}

// 3. Derive Shared AES-GCM key (ECDH derivation)
export async function getDerivedAESKey(myPrivateKey, theirPublicKey, partnerId) {
  if (partnerId && SHARED_KEYS_CACHE.has(partnerId)) {
    return SHARED_KEYS_CACHE.get(partnerId);
  }

  try {
    const aesKey = await crypto.subtle.deriveKey(
      { name: "ECDH", public: theirPublicKey },
      myPrivateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    if (partnerId) SHARED_KEYS_CACHE.set(partnerId, aesKey);
    return aesKey;
  } catch (err) {
    console.error("[E2EE Crypto] Error deriving AES key:", err);
    return null;
  }
}

// 4. Encrypt message text using AES-GCM
export async function encryptText(plainText, aesKey) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encoded
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv),
    };
  } catch (err) {
    console.error("[E2EE Crypto] Encryption failed:", err);
    return null;
  }
}

// 5. Decrypt ciphertext using AES-GCM
export async function decryptText(ciphertextBase64, ivBase64, aesKey) {
  try {
    const iv = base64ToArrayBuffer(ivBase64);
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn("[E2EE Crypto] Decryption failed or keys mismatched:", err.message);
    return null;
  }
}
