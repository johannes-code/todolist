// src/app/lib/crypto-utils.js
export async function generateEncryptionKey() {
  return await crypto.subtle.generateKey(
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
    if (!encryptedObject.iv || !encryptedObject.data) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = new Uint8Array(encryptedObject.iv);
    const encryptedData = new Uint8Array(encryptedObject.data);

    console.log("Decrypting data with:", {
      ivLength: iv.length,
      dataLength: encryptedData.length,
      ivFirst: iv[0],
      dataFirst: encryptedData[0],
    });

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
    console.error("Input data:", encryptedObject);
    throw error;
  }
}
