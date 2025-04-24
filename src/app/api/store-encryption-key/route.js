// app/api/store-encryption-key/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import { auth } from "@clerk/nextjs/server"; // Importer auth

export async function POST(request) {
  console.log("API - /api/store-encryption-key called");

  // Få tak i den autentiserte brukerens ID fra Clerk
  const { userId: authenticatedUserId } = auth();

  // Sjekk om brukeren er logget inn
  if (!authenticatedUserId) {
    console.log(
      "API - POST /store-encryption-key - Unauthorized: User not logged in"
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId: requestedUserId, exportedKey } = await request.json();
    console.log(
      "API - /api/store-encryption-key - requestedUserId:",
      requestedUserId
    ); // Logg den forespurte ID'en fra body
    console.log(
      "API - /api/store-encryption-key - exportedKey (preview):",
      exportedKey ? exportedKey.slice(0, 10) + "..." : null
    ); // Logg en forkortet versjon

    // Sjekk om den autentiserte brukerens ID matcher ID-en i request body (valgfritt men anbefalt sikkerhetssjekk)
    // Noen foretrekker å KUN stole på authenticatedUserId fra auth() og ignorere body.userId
    if (authenticatedUserId !== requestedUserId) {
      console.warn(
        `API - POST /store-encryption-key - User ID mismatch: Authenticated ${authenticatedUserId}, Requested ${requestedUserId}`
      );
      // Du kan velge å returnere 403 Forbidden her, eller fortsette med authenticatedUserId
      // For enkelhetens skyld akkurat nå, fortsetter vi med authenticatedUserId, men logger mismatch.
      // return NextResponse.json({ error: "Forbidden - User ID mismatch" }, { status: 403 });
    }

    if (!exportedKey) {
      // Vi har allerede sjekket authenticatedUserId
      console.log("API - /api/store-encryption-key - Missing exportedKey");
      return NextResponse.json(
        { error: "Missing exportedKey" },
        { status: 400 }
      );
    }

    await connectToDB();
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    console.log(
      "API - /api/store-encryption-key - Connected to collection: users"
    );

    // Finn brukeren ved hjelp av den AUTENTISERTE bruker-ID-en
    const existingUser = await usersCollection.findOne({
      userId: authenticatedUserId,
    });
    console.log(
      "API - /api/store-encryption-key - Existing user found with authenticatedId:",
      existingUser ? true : false
    );

    if (!existingUser) {
      // Dette scenarioet bør kanskje ikke skje ofte hvis brukeren må ha en profil for å lagre nøkkel,
      // men det er greit å håndtere det.
      console.log(
        `API - /api/store-encryption-key - No existing user found for authenticatedId ${authenticatedUserId}. Creating new document.`
      );
      const insertResult = await usersCollection.insertOne({
        userId: authenticatedUserId, // Lagre med den autentiserte bruker-ID-en
        encryptedKey: exportedKey,
      });
      console.log(
        "API - /api/store-encryption-key - Insert result:",
        insertResult
      );
      console.log(
        `API - /api/store-encryption-key - Encryption key stored for new user: ${authenticatedUserId}`
      );
      return NextResponse.json(
        { message: "Encryption key stored for new user" },
        { status: 201 }
      );
    } else {
      // Oppdater den eksisterende brukerens dokument ved hjelp av den AUTENTISERTE bruker-ID-en
      console.log(
        `API - /api/store-encryption-key - Found existing user for authenticatedId ${authenticatedUserId}. Updating key.`
      );
      const updateResult = await usersCollection.updateOne(
        { userId: authenticatedUserId }, // Finn dokumentet med den autentiserte bruker-ID-en
        { $set: { encryptedKey: exportedKey } }
      );
      console.log(
        "API - /api/store-encryption-key - Update result:",
        updateResult
      );
      console.log(
        `API - /api/store-encryption-key - Encryption key updated for existing user: ${authenticatedUserId}`
      );
      return NextResponse.json(
        { message: "Encryption key updated" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(
      "API - /api/store-encryption-key - Error storing encryption key:",
      error
    );
    // Sjekk om feilen kom fra Clerk auth (f.eks. hvis tokenet var ugyldig selv om middleware ikke fanget det)
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to store encryption key" },
      { status: 500 }
    );
  }
}
