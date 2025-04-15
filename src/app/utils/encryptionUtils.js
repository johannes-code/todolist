async function generateEncryptionKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportKey(key) {
  return await window.crypto.subtle.exportKey("raw", key);
}

async function importKey(exportedKey) {
  return await window.crypto.subtle.importKey(
    "jwk",
    exportedKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(key, data) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const encodedData = new TextEncoder().encode(data);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedData
  );
}
async function decryptData(key, iv, ciphertext) {
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedData);
}

export {
  generateEncryptionKey,
  exportKey,
  importKey,
  encryptData,
  decryptData,
};
