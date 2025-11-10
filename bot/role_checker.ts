/**
 * Discord Role Checker Module
 * 
 * Provides functions to check if Discord users have specific roles in a guild.
 * Can be used by the backend authentication system.
 */

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "";

/**
 * Check if a user has a specific role in a guild
 * @param userId Discord user ID
 * @param roleName Name of the role to check
 * @returns true if user has the role, false otherwise
 */
export async function checkUserHasRole(userId: string, roleName: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.warn("DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not configured");
    return false;
  }

  try {
    // Get guild member info
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!memberResponse.ok) {
      if (memberResponse.status === 404) {
        // User not in guild
        return false;
      }
      console.error(`Failed to get member info: ${memberResponse.status} ${memberResponse.statusText}`);
      return false;
    }

    const member = await memberResponse.json() as { roles: string[] };

    // Get all roles in the guild
    const rolesResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!rolesResponse.ok) {
      console.error(`Failed to get guild roles: ${rolesResponse.status} ${rolesResponse.statusText}`);
      return false;
    }

    const roles = await rolesResponse.json() as Array<{ id: string; name: string }>;
    const requiredRole = roles.find(role => role.name === roleName);

    if (!requiredRole) {
      console.warn(`Role "${roleName}" not found in guild ${DISCORD_GUILD_ID}`);
      return false;
    }

    return member.roles.includes(requiredRole.id);
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Check if a user is a member of the configured guild
 * @param userId Discord user ID
 * @returns true if user is in the guild, false otherwise
 */
export async function checkUserInGuild(userId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error checking if user is in guild:", error);
    return false;
  }
}

/**
 * Get all roles for a user in the configured guild
 * @param userId Discord user ID
 * @returns Array of role names, or empty array if user not found or error
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return [];
  }

  try {
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!memberResponse.ok) {
      return [];
    }

    const member = await memberResponse.json() as { roles: string[] };

    // Get all roles in the guild to map IDs to names
    const rolesResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!rolesResponse.ok) {
      return [];
    }

    const roles = await rolesResponse.json() as Array<{ id: string; name: string }>;
    const roleMap = new Map(roles.map(r => [r.id, r.name]));

    return member.roles
      .map(roleId => roleMap.get(roleId))
      .filter((name): name is string => name !== undefined);
  } catch (error) {
    console.error("Error getting user roles:", error);
    return [];
  }
}

