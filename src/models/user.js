// models/user.js
import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
  clerkIdHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.statics.hashClerkId = function (clerkId) {
  return crypto
    .createHash("sha256")
    .update(clerkId + process.env.CLERK_ID_SALT || "fallback-salt-value")
    .digest("hex");
};

const user = mongoose.models.User || mongoose.model("User", UserSchema);

export default user;
