// api/webhooks/clerk/route.js

import { Webhook } from "svix";
import { headers } from "next/headers";
import UserProfile from "@/models/UserProfile";
import { connectToDB } from "@/app/lib/db";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req) {
  console.log("Received webhook request");

  const payload = await req.json();
  const headerList = headers();
  const svixIdPromise = headerList.get("svix-id");
  const svixTimestampPromise = headerList.get("svix-timestamp");
  const svixSignaturePromise = headerList.get("svix-signature");

  const svixId = await svixIdPromise;
  const svixTimestamp = await svixTimestampPromise;
  const svixSignature = await svixSignaturePromise;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing required svix headers", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);

  let evt;

  try {
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
    return new Response("Error occured -- SVIX verification failed", {
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
