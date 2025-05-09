// app/lib/user-mapping.js
import User from '@/models/user';
import crypto from 'crypto';

export async function getInternalUserId(clerkId) {
  if (!clerkId) return null;
  
  try {
    const clerkIdHash = hashClerkId(clerkId);
    
    let user = await User.findOne({ clerkIdHash });
    
    if (!user) {
      console.log("Creating new user mapping for Clerk ID");
      user = new User({
        clerkIdHash,
        createdAt: new Date()
      });
      await user.save();
    }
    
    return user._id.toString();
  } catch (error) {
    console.error("Error in user mapping:", error);
    return null;
  }
}

function hashClerkId(clerkId) {
  const salt = process.env.CLERK_ID_SALT || 'default-salt-for-development';
  
  return crypto
    .createHash('sha256')
    .update(clerkId + salt)
    .digest('hex');
}

