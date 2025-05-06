// app/utils/authUtils.js

/**
 * Gets the authentication token from Clerk session with fallback methods
 * @param {Object} session - The Clerk session object
 * @returns {Promise(null)} The JWT token or null if unavailable
 */
export async function getAuthToken() {
  if (typeof window !== "undefined" && window.Clerk?.session) {
    try {
      return await window.Clerk.session.getToken();
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  }
  return null;
}
