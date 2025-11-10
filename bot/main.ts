/**
 * Discord Bot for Foxhole Calendar
 * 
 * This bot can be run as a standalone service to provide role checking functionality.
 * It connects to Discord and can respond to commands or events.
 * 
 * Currently, the bot primarily serves as a role checker for the authentication system.
 * The backend uses the role_checker.ts module directly via API calls.
 */

import { checkUserHasRole, checkUserInGuild, getUserRoles } from "./role_checker.ts";

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "";
const DISCORD_REQUIRED_ROLE = Deno.env.get("DISCORD_REQUIRED_ROLE") || "Member";

// Bot configuration
const BOT_INTENTS = 0; // No intents needed for API-only bot

/**
 * Verify bot configuration
 */
function verifyConfig(): boolean {
  if (!DISCORD_BOT_TOKEN) {
    console.error("❌ DISCORD_BOT_TOKEN is not set in environment variables");
    return false;
  }

  if (!DISCORD_GUILD_ID) {
    console.warn("⚠️  DISCORD_GUILD_ID is not set. Role checking will be disabled.");
  }

  return true;
}

/**
 * Test bot connection and permissions
 */
async function testBotConnection(): Promise<boolean> {
  console.log("🔍 Testing bot connection...");

  try {
    // Test bot token by getting bot user info
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`❌ Bot token invalid: ${response.status} ${response.statusText}`);
      return false;
    }

    const botUser = await response.json() as { id: string; username: string };
    console.log(`✅ Bot connected as: ${botUser.username} (${botUser.id})`);

    // Test guild access if configured
    if (DISCORD_GUILD_ID) {
      const guildResponse = await fetch(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}`,
        {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          },
        }
      );

      if (!guildResponse.ok) {
        console.error(`❌ Cannot access guild ${DISCORD_GUILD_ID}: ${guildResponse.status}`);
        console.error("   Make sure the bot is in the server and has proper permissions");
        return false;
      }

      const guild = await guildResponse.json() as { name: string };
      console.log(`✅ Bot can access guild: ${guild.name}`);

      // Test role checking
      if (DISCORD_REQUIRED_ROLE) {
        const rolesResponse = await fetch(
          `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (rolesResponse.ok) {
          const roles = await rolesResponse.json() as Array<{ id: string; name: string }>;
          const requiredRole = roles.find(r => r.name === DISCORD_REQUIRED_ROLE);
          
          if (requiredRole) {
            console.log(`✅ Required role found: ${DISCORD_REQUIRED_ROLE} (${requiredRole.id})`);
          } else {
            console.warn(`⚠️  Required role "${DISCORD_REQUIRED_ROLE}" not found in guild`);
            console.log(`   Available roles: ${roles.map(r => r.name).join(", ")}`);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error testing bot connection:", error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🤖 Foxhole Calendar Discord Bot");
  console.log("================================\n");

  // Verify configuration
  if (!verifyConfig()) {
    Deno.exit(1);
  }

  // Test connection
  const connected = await testBotConnection();
  if (!connected) {
    console.error("\n❌ Bot connection test failed. Please check your configuration.");
    Deno.exit(1);
  }

  console.log("\n✅ Bot is ready!");
  console.log("\n📝 Note: This bot is primarily used for role checking via API calls.");
  console.log("   The backend authentication system uses the role_checker.ts module");
  console.log("   to verify user roles during login.\n");

  // Keep process alive (in case we add event listeners later)
  console.log("🔄 Bot is running. Press Ctrl+C to stop.\n");
  
  // Wait for interrupt signal
  await new Promise(() => {});
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    Deno.exit(1);
  });
}

