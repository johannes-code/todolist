// src/app/lib/crypto-utils.js

// Hash the user ID before deriving the key
async function hashUserId(userId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

// Derive a consistent encryption key from the user's ID
export async function deriveKeyFromUserId(userId) {
  // First hash the user ID for additional entropy
  const hashedUserId = await hashUserId(userId);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    hashedUserId,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Use a fixed salt (in production, you might want to make this configurable)
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
  // Convert JSON data to Uint8Array
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(JSON.stringify(data));

  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataToEncrypt
  );

  return {
    iv: Array.from(iv), // Convert to regular array for JSON serialization
    encryptedData: Array.from(new Uint8Array(encryptedData)), // Convert to regular array
  };
}

export async function decryptData(key, encryptedObject) {
  try {
    // Ensure we have the required data
    if (!encryptedObject.iv || !encryptedObject.data) {
      throw new Error("Invalid encrypted data format");
    }

    // Convert arrays back to Uint8Array
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

    // Convert decrypted data back to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}
