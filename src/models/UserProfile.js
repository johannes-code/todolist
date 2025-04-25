import mongoose from "mongoose";

const UserProfile = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  hasEncryptedKey: {
    type: Boolean,
    default: false,
  },
  encryptedKey: {
    type: [Number], // Array of numbers representing the encrypted key bytes
    select: false, // Don't return this field by default
  },
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the timestamp on save
UserProfile.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfile);
