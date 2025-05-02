import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Add index for faster lookups
    },
    kdk: {
      type: Buffer,
      default: null,
    },

    kdkSalt: {
      type: Buffer,
      default: null,
    },

    hasEncryptedKey: { type: Boolean, default: false },

    // Add any other profile fields you need
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Avoid creating model if it already exists (important for HMR)
export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);
