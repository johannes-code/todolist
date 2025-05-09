// api/webhooks/clerk/route.js

import { Webhook } from "svix";
import { headers } from "next/headers";
import UserProfile from "@/models/UserProfile";
import { connectToDB } from "@/app/lib/db";
import "tzdata";
process.env.TZ = "Europe/Oslo";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req) {
  console.log("Received webhook request");

  if (!webhookSecret) {
    console.error("Webhook secret is not set in environment variables.");
    return new Response("Webhook secret is not set", { status: 500 });
  }

  const payload = await req.json();
  const headersList = await headers();

  const svixId = await headersList.get("svix-id");
  const svixTimestamp = await headersList.get("svix-timestamp");
  const svixSignature = await headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing required svix headers", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);

  let evt;

  try {
    console.log("SVIX Headers:", { svixId, svixTimestamp, svixSignature }); // Log the headers
    evt = wh.verify(
      JSON.stringify(payload),
      {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      },
      { tolerance: 5 * 60 * 1000 }
    );
    console.log("Webhook verified successfully:", evt);
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred -- SVIX verification failed", {
      status: 400,
    });
  }

  const eventType = evt?.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    try {
      await connectToDB();
      const newUserProfile = await UserProfile.create({
        userId: id,
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name,
      });

      console.log("User profile created:", newUserProfile);
      return new Response("User profile created successsfully", {
        status: 201,
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
      return new Response("Error creating user profile", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
