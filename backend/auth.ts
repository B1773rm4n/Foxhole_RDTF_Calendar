/**
 * Discord OAuth2 authentication handler
 */

import { getUserByDiscordId, createUser, type User } from "./database.ts";

// These should be set via environment variables
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") || "";
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") || "";
const DISCORD_REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URI") || "http://localhost:8000/api/auth/callback";
const SESSION_SECRET = Deno.env.get("SESSION_SECRET") || "change-me-in-production";

// In-memory session store (in production, use Redis or similar)
const sessions = new Map<string, { userId: number; expiresAt: number }>();

/**
 * Generate a random session token
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a session for a user
 */
export function createSession(userId: number): string {
  const token = generateSessionToken();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  
  sessions.set(token, { userId, expiresAt });
  
  // Clean up expired sessions periodically
  cleanupExpiredSessions();
  
  return token;
}

/**
 * Get user ID from session token
 */
export function getUserIdFromSession(token: string): number | null {
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  
  return session.userId;
}

/**
 * Delete a session
 */
export function deleteSession(token: string): void {
  sessions.delete(token);
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

/**
 * Get Discord OAuth authorization URL
 */
export function getDiscordAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });
  
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Get user info from Discord API
 */
async function getDiscordUserInfo(accessToken: string): Promise<{ id: string; username: string; avatar: string | null }> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }
  
  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : null,
  };
}

/**
 * Handle Discord OAuth callback
 */
export async function handleDiscordCallback(code: string): Promise<{ user: User; sessionToken: string }> {
  // Exchange code for token
  const accessToken = await exchangeCodeForToken(code);
  
  // Get user info from Discord
  const discordUser = await getDiscordUserInfo(accessToken);
  
  // Get or create user in database
  let user = getUserByDiscordId(discordUser.id);
  if (!user) {
    user = createUser(discordUser.id, discordUser.username, discordUser.avatar);
  } else {
    // Update username and avatar if changed
    // (This would require an update function, but for now we'll skip it)
  }
  
  // Create session
  const sessionToken = createSession(user.id);
  
  return { user, sessionToken };
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

