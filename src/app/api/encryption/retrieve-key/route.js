// src/app/api/encryption/retrieve-key/route.js

import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db";
import User from "@/models/User";
import { initializeSodium } from "@/utils/encryption";

const SERVER_SECRET_KEY = process.env.SERVER_ENCRYPTION_SECRET;

async function decryptWithServerKey(base64Combined) {
  await initializeSodium();
  const key = sodium.from_base64(SERVER_SECRET_KEY);
  const combined = sodium.from_base64(base64Combined);
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(
      ciphertext,
      nonce,
      key
    );
    return sodium.to_base64(plaintextBytes);
  } catch (error) {
    console.error("Error decrypting with server key:", error);
    return null;
  }
}

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!SERVER_SECRET_KEY) {
    console.error("SERVER_ENCRYPTION_SECRET environment variable is not set!");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    await connectToDB();

    const user = await User.findOne({ clerkId: clerkUserId });

    if (!user || !user.encryptedDataKey) {
      return new Response("Encryption key not found for user", { status: 404 });
    }

    const encryptedKeyBase64 = user.encryptedDataKey;
    const decryptedKeyBase64 = await decryptWithServerKey(encryptedKeyBase64);

    if (!decryptedKeyBase64) {
      return new Response("Failed to decrypt encryption key", { status: 500 });
    }

    return new Response(
      JSON.stringify({ dataEncryptionKey: decryptedKeyBase64 }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving encryption key:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve encryption key" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
