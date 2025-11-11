/**
 * Authentication session utilities
 */

import { 
  createSession as dbCreateSession, 
  getSessionByToken, 
  deleteSession as dbDeleteSession, 
  deleteExpiredSessions 
} from "./database.ts";

function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a session for a user (stored in database)
 */
export function createSession(userId: number): string {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3); // 3 days from now
  
  // Create session in database
  dbCreateSession(userId, token, expiresAt);
  
  return token;
}

/**
 * Initialize scheduled session cleanup
 * Call this once at application startup
 */
export function initSessionCleanup(): void {
  // Clean up expired sessions every hour
  setInterval(() => {
    deleteExpiredSessions();
  }, 60 * 60 * 1000);
  
  // Run initial cleanup
  deleteExpiredSessions();
}

/**
 * Get user ID from session token
 */
export function getUserIdFromSession(token: string): number | null {
  const session = getSessionByToken(token);
  if (!session) {
    return null;
  }
  
  return session.user_id;
}

/**
 * Delete a session
 */
export function deleteSession(token: string): void {
  dbDeleteSession(token);
}

/**
 * Get session token from request cookie or header
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  // Try cookie first
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("session=")) {
        return cookie.substring(8);
      }
    }
  }
  
  // Try Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  return null;
}

