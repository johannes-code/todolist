// src/app/api/test/route.js
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    log("Test endpoint called");

    // Test basic response
    const basicTest = {
      timestamp: new Date().toISOString(),
      message: "Test endpoint working",
    };

    // Test Clerk auth
    let authTest = {};
    try {
      const user = await currentUser();
      authTest = {
        authenticated: !!user,
        userId: user?.id || null,
        email: user?.emailAddresses?.[0]?.emailAddress || null,
      };
    } catch (authError) {
      authTest = {
        authenticated: false,
        error: authError.message,
      };
    }

    return NextResponse.json({
      ...basicTest,
      auth: authTest,
    });
  } catch (error) {
    logError("Test endpoint error:", error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
