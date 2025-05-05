// utils/encryptionUtils.js
// This module provides functions for generating, exporting, importing, encrypting, and decrypting data using the Web Crypto API.

async function generateEncryptionKey() {
  const key = await window.crypto.subtle.generateKey(
    // Generate the key first
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  // console.log("Generated Key:", key); // Log before returning
  return key; // Then return
}

async function encryptData(key, data) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    iv: iv,
    ciphertext: ciphertext,
  };
}
async function decryptData(key, ivBase64, ciphertextBase64) {
  console.log("Decrypting with key:", key);
  console.log("IV length (Base64):", ivBase64 ? ivBase64.length : 0);
  console.log(
    "Ciphertext length (Base64):",
    ciphertextBase64 ? ciphertextBase64.length : 0
  );

  const ivBuffer = Buffer.from(ivBase64, "base64");

  const ivBytes = new Uint8Array(ivBuffer);
  console.log("IV length (Bytes):", ivBytes.byteLength);

  const ciphertextBuffer = Buffer.from(ciphertextBase64, "base64");
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  console.log("Ciphertext length (Bytes):", ciphertextBytes.byteLength);

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    key,
    ciphertextBytes.buffer
  );

  return new TextDecoder().decode(decryptedData);
}

async function deriveEncryptionKey(kdk, encryptioSalt) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encryptioSalt,
      iterations: 100000,
      hash: "SHA-256",
    },
    kdk,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export { generateEncryptionKey, encryptData, decryptData, deriveEncryptionKey };
