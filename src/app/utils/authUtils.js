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

// try {
//   // Primary method: use the getToken method from the session
//   return await session.getToken();
// } catch (primaryError) {
//   console.error("Primary token retrieval method failed:", primaryError);

//   // Fallback method 1: Try accessing the lastActiveToken if available
//   try {
//     if (window.Clerk?.session?.lastActiveToken?.jwt?.claims?.__raw) {
//       console.log("Using fallback method 1: lastActiveToken.jwt.claims.__raw");
//       return window.Clerk.session.lastActiveToken.jwt.claims.__raw;
//     }
//   } catch (fallback1Error) {
//     console.error("Fallback method 1 failed:", fallback1Error);
//   }

//   // Fallback method 2: Try to get token from Clerk.client
//   try {
//     if (window.Clerk?.client?.sessions) {
//       const activeSession = window.Clerk.client.sessions.find(
//         (s) => s.status === "active"
//       );
//       if (activeSession) {
//         console.log("Using fallback method 2: activeSession.getToken()");
//         return await activeSession.getToken();
//       }
//     }
//   } catch (fallback2Error) {
//     console.error("Fallback method 2 failed:", fallback2Error);
//   }

//   console.error("All token retrieval methods failed");
//   return null;
// }
