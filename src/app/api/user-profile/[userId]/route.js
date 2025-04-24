// app/api/user-profile/[userid]/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import { auth } from "@clerk/nextjs/server"; // Importer auth

export async function GET(request, { params }) {
  try {
    const requestedUserId = params.userId; // Bruker-ID fra URL-parameteren
    console.log("API - Requested userId:", requestedUserId);

    // Få tak i den autentiserte brukerens ID fra Clerk
    const { userId: authenticatedUserId } = auth();

    // Sjekk om brukeren er logget inn
    if (!authenticatedUserId) {
      console.log("API - GET /user-profile - Unauthorized: User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sjekk om den autentiserte brukerens ID matcher den forespurte ID-en
    if (authenticatedUserId !== requestedUserId) {
      console.log(
        `API - GET /user-profile - Forbidden: User ${authenticatedUserId} tried to access profile ${requestedUserId}`
      );
      return NextResponse.json(
        { error: "Forbidden - Cannot access other users' profiles" },
        { status: 403 }
      );
    }

    // Koble til databasen først etter at autorisasjon er sjekket
    await connectToDB();
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Hent brukerprofilen for den AUTENTISERTE brukerens ID
    const user = await usersCollection.findOne({ userId: authenticatedUserId });
    console.log("API - User found:", user);

    let hasEcryptedKey = false;
    if (
      user &&
      user.encryptedKey &&
      Object.keys(user.encryptedKey).length > 0
    ) {
      // Sjekk om encryptedKey er et array og ikke tomt, siden du lagrer det som Array<number>
      if (Array.isArray(user.encryptedKey) && user.encryptedKey.length > 0) {
        hasEcryptedKey = true;
      } else if (
        user.encryptedKey instanceof Uint8Array &&
        user.encryptedKey.byteLength > 0
      ) {
        // Om du lagrer det som Binary data, sjekk byteLength
        hasEcryptedKey = true;
      } else {
        // Fallback sjekk for et generelt objekt
        hasEcryptedKey = Object.keys(user.encryptedKey).length > 0;
      }
    }
    console.log("API - hasEcryptedKey:", hasEcryptedKey);

    // Returner hasEcryptedKey (og eventuelt encryptedKey HVIS forespørselen er fra den autentiserte brukeren)
    // Du kan vurdere å sende selve nøkkelen her også, men da MÅ den dekrypteres på frontend.
    // Basert på din initializeEncryptionKey funksjon i home-client.jsx, ser det ut til
    // at du forventer å hente nøkkelen her. La oss inkludere den, men VÆR SIKKER PÅ AT DEN ALDRI
    // SENDES TILBAKE TIL EN UAUTENTISERT ELLER FEIL BRUKER.
    return NextResponse.json(
      { hasEcryptedKey, encryptedKey: user?.encryptedKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Sjekk om feilen kom fra Clerk auth (f.eks. hvis tokenet var ugyldig selv om middleware ikke fanget det)
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Sørg for at andre metoder (som PUT/POST hvis du legger til dem) også bruker auth()
