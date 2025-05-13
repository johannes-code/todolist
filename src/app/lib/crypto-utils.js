// src/app/lib/crypto-utils.js

async function hashUserId(userId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

export async function hashUserIdToHex(userId) {
  const hashBuffer = await hashUserId(userId);
  return Array.from(hashBuffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deriveKeyFromUserId(userId) {
  const hashedUserId = await hashUserId(userId);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    hashedUserId,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const encoder = new TextEncoder();
  const salt = encoder.encode("todo-app-salt-v1");

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key, data) {
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(JSON.stringify(data));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataToEncrypt
  );

  return {
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encryptedData)),
  };
}

export async function decryptData(key, encryptedObject) {
  try {
    if (!encryptedObject.iv || !encryptedObject.data) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = new Uint8Array(encryptedObject.iv);
    const encryptedData = new Uint8Array(encryptedObject.data);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}
