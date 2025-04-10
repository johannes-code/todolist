import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  encryptedDataKey: { type: string },
});

const User = mongoose.models.User || mongoose.model("User, UserSchema");

export default User;
