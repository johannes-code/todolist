// src/app/api/encryption/setup/route.js

import { auth } from "@clerk/nextjs";
import { connectToDB } from "@/app/lib/db";
import User from "@/models/User";
import sodium, { initializeSodium } from "@/utils/encryption";

const SERVER_SECRET_KEY = process.env.SERVER_ENCRYPTION_SECRET;

async function encryptWithServerKey(data) {
  await initializeSodium();
  const key = sodium.from_base64(SERVER_SECRET_KEY);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, key);
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined);
}

export async function POST(request) {
  const { userId } = await request.json();
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId || userId !== clerkUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!SERVER_SECRET_KEY) {
    console.error("SERVER_ENCRYPTION_SECRET environment variable is not set!");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    await connectToDB();

    // Find the user in your database (assuming you associate Clerk userId)
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      console.log(`User not found with Clerk ID: ${userId}`);
      user = new User({ clerkId: userId });
    }

    await initializeSodium();
    const dataEncryptionKeyBytes = sodium.crypto_secretbox_keygen();
    const base64DataEncryptionKey = sodium.to_base64(dataEncryptionKeyBytes);

    const encryptedKey = await encryptWithServerKey(base64DataEncryptionKey);

    user.encryptedDataKey = encryptedKey;
    await user.save();

    console.log(`Encryption key generated and stored for user: ${userId}`);
    return new Response(
      JSON.stringify({
        message: "Encryption key setup initiated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error setting up encryption key on backend:", error);
    return new Response(
      JSON.stringify({ error: "Failed to setup encryption key" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
