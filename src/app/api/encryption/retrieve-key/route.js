import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db";
import User from "@/models/User";

import { sodium, initializeSodium } from "@/utils/encryption";

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
  console.log("GET /api/encryption/retrieve-key called"); 
  const { userId: clerkUserId } = await auth();
  console.log("Clerk User ID:", clerkUserId); 

  if (!clerkUserId) {
    console.log("User not authenticated"); 
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!SERVER_SECRET_KEY) {
    console.error("SERVER_ENCRYPTION_SECRET environment variable is not set!");
    return new Response(JSON.stringify ({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-type": "application/json" },
    });
  }
  console.log("SERVER_SECRET_KEY is set"); 

  try {
    console.log("Connecting to database..."); 
    await connectToDB();
    console.log("Database connected"); 

    const user = await User.findOne({ clerkId: clerkUserId }); 
    console.log("User found:", user); 

    if (!user || !user.encryptedDataKey) {
      console.log("Encryption key not found for user"); 
      return new Response(JSON.stringify({ error: "Encryption key not found for user" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encryptedKeyBase64 = user.encryptedDataKey;
    console.log("Encrypted key:", encryptedKeyBase64); 
    const decryptedKeyBase64 = await decryptWithServerKey(encryptedKeyBase64);
    console.log("Decrypted key:", decryptedKeyBase64); 

    if (!decryptedKeyBase64) {
      console.log("Failed to decrypt encryption key"); 
      return new Response(JSON.stringify({ error: "Failed to decrypt encryption key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
