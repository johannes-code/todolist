// app/lib/user-mapping.js
import User from '@/models/user';

/**
 * Get or create the internal user ID based on the Clerk ID
 * @param {string} clerkId - The Clerk user ID
 * @param {object} userData - Optional user data to include when creating a new user
 * @returns {Promise<string|null>} The internal MongoDB user ID
 */
export async function getInternalUserId(clerkId, userData = {}) {
  if (!clerkId) {
    console.error("No Clerk ID provided to getInternalUserId");
    return null;
  }
  
  try {
    console.log(`Looking up internal user ID for Clerk ID: ${clerkId.substring(0, 8)}...`);
    
    // Hash the Clerk ID for secure lookup
    const clerkIdHash = User.hashClerkId(clerkId);
    
    // Look for an existing user with this hash
    let user = await User.findOne({ clerkIdHash });
    
    if (user) {
      console.log(`Found existing user mapping. Internal ID: ${user._id}`);
      
      // Update last active timestamp
      user.stats = user.stats || {};
      user.stats.lastActive = new Date();
      await user.save();
      
      return user._id.toString();
    }
    
    // Create a new user if none exists
    console.log("No existing user found. Creating new user mapping...");
    
    user = new User({
      clerkIdHash,
      ...userData, // Include any additional user data
      stats: {
        lastActive: new Date(),
        todosCreated: 0,
        todosCompleted: 0
      }
    });
    
    await user.save();
    console.log(`Created new user with internal ID: ${user._id}`);
    
    return user._id.toString();
  } catch (error) {
    console.error("Error in user mapping:", error);
    return null;
  }
}

/**
 * Get the internal user by Clerk ID
 * @param {string} clerkId - The Clerk user ID
 * @returns {Promise<object|null>} The user document or null
 */
export async function getUserByClerkId(clerkId) {
  if (!clerkId) return null;
  
  try {
    const clerkIdHash = User.hashClerkId(clerkId);
    return await User.findOne({ clerkIdHash });
  } catch (error) {
    console.error("Error finding user by Clerk ID:", error);
    return null;
  }
}

/**
 * Update user stats when a todo is created
 * @param {string} userId - The internal user ID
 */
export async function incrementTodosCreated(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.todosCreated': 1 },
      $set: { 'stats.lastActive': new Date() }
    });
  } catch (error) {
    console.error("Error updating todos created count:", error);
  }
}

/**
 * Update user stats when a todo is completed
 * @param {string} userId - The internal user ID
 */
export async function incrementTodosCompleted(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.todosCompleted': 1 },
      $set: { 'stats.lastActive': new Date() }
    });
  } catch (error) {
    console.error("Error updating todos completed count:", error);
  }
}