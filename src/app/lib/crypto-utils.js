// src/app/lib/crypto-utils

export async function generateEncryptionKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key) {
  return window.crypto.subtle.exportKey("jwk", key);
}

export async function importKey(keyData) {
  return window.crypto.subtle.importKey(
    "jwk",
    keyData,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key, data) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  );
  return {
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encrypted)),
  };
}

export async function decryptData(key, { iv, encryptedData }) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encryptedData)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

export function clearStoredKeys() {
  localStorage.removeItem("encrypdedKey");
  console.log("Cleared stored encryption keys");
  return true;
}

export async function encryptWithSession(key, sessionToken) {
  const encoder = new TextEncoder();

  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(sessionToken),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const wrappingKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("key-protection-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const exportedKey = await exportKey(key);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      wrappingKey,
      new TextEncoder().encode(JSON.stringify(exportedKey))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    };
  } catch (error) {
    console.error("Error in encryptWithSession:", error);
    throw error;
  }
}

export async function decryptWithSession(encryptedKey, sessionToken) {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(sessionToken),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const wrappingKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("key-protection-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(encryptedKey.iv),
      },
      wrappingKey,
      new Uint8Array(encryptedKey.data)
    );

    const decryptedKey = JSON.parse(new TextDecoder().decode(decrypted));
    return await importKey(decryptedKey);
  } catch (error) {
    console.error("Key decryption failed:", error);
    if (error.name === "OperationError") {
      console.log(
        "This may be due to a change in key configuration. Clearing stored keys"
      );
      clearStoredKeys();
    }
    throw error;
  }
}
