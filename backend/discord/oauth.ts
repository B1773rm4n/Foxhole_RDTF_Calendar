/**
 * Discord OAuth2 authentication utilities
 */

import { 
  getUserByDiscordId, 
  createUser, 
  type User 
} from "../database.ts";
import { createSession } from "../auth.ts";
import { 
  checkUserHasRole as botCheckUserHasRole, 
  checkUserInGuild as botCheckUserInGuild 
} from "../../bot/role_checker.ts";

// Environment configuration
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") || "";
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") || "";
const DISCORD_REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URI") || "http://localhost:8000/api/auth/callback";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || ""; // Optional: for role checking

// Allowed roles for login (users need at least one of these)
const ALLOWED_ROLES = ["Member", "Admin"];

// Cache for Discord roles list (roles rarely change)
interface RolesCache {
  roles: Array<{ id: string; name: string }>;
  expiresAt: number;
}

let rolesCache: RolesCache | null = null;
const ROLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGuildRoles(useBotToken: boolean, accessToken?: string): Promise<Array<{ id: string; name: string }>> {
  if (rolesCache && rolesCache.expiresAt > Date.now()) {
    return rolesCache.roles;
  }

  const headers: Record<string, string> = useBotToken && DISCORD_BOT_TOKEN
    ? { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    : accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  if (!headers.Authorization) {
    throw new Error("No authentication method available");
  }

  const response = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new Error(`Discord rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }
    throw new Error(`Failed to get guild roles: ${response.status} ${response.statusText}`);
  }

  const roles = await response.json() as Array<{ id: string; name: string }>;

  rolesCache = {
    roles,
    expiresAt: Date.now() + ROLES_CACHE_TTL,
  };

  return roles;
}

async function getGuildMember(userId: string, useBotToken: boolean, accessToken?: string): Promise<{ roles: string[] } | null> {
  const headers: Record<string, string> = useBotToken && DISCORD_BOT_TOKEN
    ? { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    : accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  if (!headers.Authorization) {
    throw new Error("No authentication method available");
  }

  const url = useBotToken && DISCORD_BOT_TOKEN
    ? `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`
    : `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new Error(`Discord rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to get guild member: ${response.status} ${response.statusText}`);
  }

  return await response.json() as { roles: string[] };
}

/**
 * Get Discord OAuth authorization URL
 */
export function getDiscordAuthUrl(): string {
  const scopes = DISCORD_BOT_TOKEN ? "identify guilds" : "identify guilds guilds.members.read";

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: scopes,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

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
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new Error(`Discord rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getDiscordUserInfo(accessToken: string): Promise<{ id: string; username: string; avatar: string | null }> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      throw new Error(`Discord rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }
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

async function checkUserInGuild(accessToken: string, userId?: string): Promise<boolean> {
  if (!DISCORD_GUILD_ID) {
    return true;
  }

  if (DISCORD_BOT_TOKEN && userId) {
    try {
      return await botCheckUserInGuild(userId);
    } catch (error) {
      console.warn("Bot check failed, falling back to OAuth method:", error);
    }
  }

  try {
    const member = await getGuildMember(userId || "", false, accessToken);
    return member !== null;
  } catch (_error) {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
        throw new Error(`Discord rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      }
      return false;
    }

    const guilds = await response.json() as Array<{ id: string }>;
    return guilds.some(guild => guild.id === DISCORD_GUILD_ID);
  }
}

async function checkUserHasAllowedRole(userId: string, accessToken?: string): Promise<boolean> {
  if (!DISCORD_GUILD_ID || ALLOWED_ROLES.length === 0) {
    return true;
  }

  if (DISCORD_BOT_TOKEN) {
    for (const roleName of ALLOWED_ROLES) {
      if (await botCheckUserHasRole(userId, roleName)) {
        return true;
      }
    }
    return false;
  }

  if (accessToken) {
    try {
      const response = await fetch(`https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const member = await response.json() as { roles: string[] };

      const rolesResponse = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!rolesResponse.ok) {
        return false;
      }

      const roles = await rolesResponse.json() as Array<{ id: string; name: string }>;

      for (const allowedRoleName of ALLOWED_ROLES) {
        const allowedRole = roles.find(role => role.name === allowedRoleName);
        if (allowedRole && member.roles.includes(allowedRole.id)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking role with OAuth token:", error);
      return false;
    }
  }

  return false;
}

/**
 * Handle Discord OAuth callback
 */
export async function handleDiscordCallback(code: string): Promise<{ user: User; sessionToken: string }> {
  const accessToken = await exchangeCodeForToken(code);
  const discordUser = await getDiscordUserInfo(accessToken);

  if (DISCORD_GUILD_ID) {
    const inGuild = await checkUserInGuild(accessToken, discordUser.id);
    if (!inGuild) {
      throw new Error("You must be a member of the required Discord server to access this application.");
    }
  }

  if (DISCORD_GUILD_ID && ALLOWED_ROLES.length > 0) {
    const hasAllowedRole = await checkUserHasAllowedRole(discordUser.id, accessToken);
    if (!hasAllowedRole) {
      throw new Error(`You must have one of the following roles in the Discord server to access this application: ${ALLOWED_ROLES.join(", ")}`);
    }
  }

  let user = getUserByDiscordId(discordUser.id);
  if (!user) {
    user = createUser(discordUser.id, discordUser.username, discordUser.avatar);
  }

  const sessionToken = createSession(user.id);

  return { user, sessionToken };
}


