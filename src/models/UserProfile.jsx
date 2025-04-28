import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Add index for faster lookups
  },
  hasEncryptedKey: {
    type: Boolean,
    default: false,
  },
  encryptedKey: {
    type: Buffer, // Store raw key bytes as Buffer
    default: null,
  },
  // Add any other profile fields you need
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
UserProfileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Avoid creating model if it already exists (important for HMR)
export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);
