import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/app/models/user";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req) {
  const payload = await req.text();
  const svixId = (await headers()).get("svix-id");
  const svixSignature = headers().get("svix-signature");

  if (!svixId || !svixSignature || !webhookSecret) {
    return new Response("Error occured -- no svix headers or web secret.", {
      status: 400,
    });
  }

  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured -- invalid signature", { status: 400 });
  }

  const eventType = evt?.type;

  if (eventType === "user.created") {
    const {
      id,
      email_adresses: email_addresses,
      first_name,
      last_name,
    } = evt.data;

    try {
      await mongoose.connect(process.env.MONGODB_URI);

      const newUser = new User({
        clerkId: id,
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name,
      });

      await newUser.save();

      console.log("User created in DB", id);
      return NextResponse.json(
        { message: "User created successfully" },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating user in DB", error);
      return NextResponse.json(
        { error: "Failed to create user in DB" },
        { status: 500 }
      );
    } finally {
      await mongoose.disconnect();
    }
  }

  return new Response(`Webhook recieved: ${eventType}`, { status: 200 });
}
