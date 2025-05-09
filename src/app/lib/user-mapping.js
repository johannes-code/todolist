// lib/user-mapping.js
import User from '@/models/user';

// Get or create the internal user ID based on the Clerk ID
export async function getInternalUserId(clerkId) {
  if (!clerkId) return null;
  
  // Hash the Clerk ID for lookup
  const clerkIdHash = User.hashClerkId(clerkId);
  
  // Look for an existing user with this hash
  let user = await User.findOne({ clerkIdHash });
  
  if (!user) {
    // Create a new internal user if none exists
    user = new User({
      clerkIdHash,
    });
    await user.save();
  }
  
  return user._id.toString();
}