import sodium from "libsodium-wrappers";
import { scryptSync } from "crypto-browserify";

async function initializeSodium() {
  await sodium.ready;
}

async function generateDataEncryptionKey() {
  await initializeSodium();
  const key = sodium.crypto_secretbox_keygen();
  return sodium.to_base64(key);
}

async function deriveMasterKey(password, salt) {
  await initializeSodium();
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = sodium.from_base64(salt); //Assuming salt is stored as b64
  const derivedKey = scryptSync(passwordBuffer, saltBuffer, 32); //32b for AES-256
  return sodium.to_base64(derivedKey);
}

async function encryptData(data, base64Key) {
  await initializeSodium();
  const key = sodium.from_base64(base64Key);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, key);
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined);
}

async function decryptData(base64Combined, base64Key) {
  await initializeSodium();
  const key = sodium.from_base64(base64Key);
  const combined = sodium.from_base64(base64Combined);
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(
      ciphertext,
      nonce,
      key
    );
    return sodium.to_string(plaintextBytes, "utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

async function encryptKey(dataEncryptionKeyBase64, masterKeyBase64) {
  await initializeSodium();
  const masterKey = sodium.from_base64(masterKeyBase64);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const dataKeyBytes = sodium.from_base64(dataEncryptionKeyBase64);
  const ciphertext = sodium.crypto_secretbox_easy(
    dataKeyBytes,
    nonce,
    masterKey
  );
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined);
}

async function decryptKey(base64Combined, masterKeyBase64) {
  await initializeSodium();
  const masterKey = sodium.from_base64(masterKeyBase64);
  const combined = sodium.from_base64(base64Combined);
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(
      ciphertext,
      nonce,
      masterKey
    );
    return sodium.to_base64(plaintextBytes);
  } catch (error) {
    console.error("Key decrytion failed", error);
    return null;
  }
}

export {
  sodium,
  initializeSodium,
  generateDataEncryptionKey,
  deriveMasterKey,
  encryptData,
  decryptData,
  encryptKey,
  decryptKey,
};
