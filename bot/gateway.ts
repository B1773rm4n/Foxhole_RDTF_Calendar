/**
 * Discord Gateway WebSocket connection
 * Handles real-time events from Discord
 */

import { loadEnvFile } from "./env_loader.ts";

// Load environment variables from .env file
loadEnvFile();

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "";

interface GatewayPayload {
  op: number;
  d?: unknown;
  s?: number;
  t?: string;
}

let ws: WebSocket | null = null;
let heartbeatInterval: number | null = null;
let sequenceNumber: number | null = null;
let sessionId: string | null = null;
let resumeGatewayUrl: string | null = null;

/**
 * Get Gateway URL from Discord
 */
async function getGatewayUrl(): Promise<string> {
  const response = await fetch("https://discord.com/api/gateway");
  const data = await response.json() as { url: string };
  return data.url;
}

/**
 * Send payload to Gateway
 */
function sendPayload(payload: GatewayPayload): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/**
 * Start heartbeat to keep connection alive
 */
function startHeartbeat(interval: number): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    sendPayload({ op: 1, d: sequenceNumber });
  }, interval);
}

/**
 * Handle incoming Gateway messages
 */
async function handleGatewayMessage(event: MessageEvent): Promise<void> {
  const payload = JSON.parse(event.data) as GatewayPayload;

  switch (payload.op) {
    case 10: // Hello
      {
        const data = payload.d as { heartbeat_interval: number };
        console.log("🔌 Connected to Discord Gateway");
        startHeartbeat(data.heartbeat_interval);
        
        // Identify
        // Intents: GUILDS (1) + GUILD_MESSAGES (512) = 513
        if (!DISCORD_BOT_TOKEN) {
          console.error("❌ DISCORD_BOT_TOKEN is not set. Cannot identify with Gateway.");
          return;
        }
        
        sendPayload({
          op: 2,
          d: {
            token: DISCORD_BOT_TOKEN,
            properties: {
              os: "linux",
              browser: "foxhole-calendar-bot",
              device: "foxhole-calendar-bot",
            },
            intents: 513, // GUILDS (1) + GUILD_MESSAGES (512)
          },
        });
      }
      break;

    case 11: // Heartbeat ACK
      // Heartbeat acknowledged, connection is alive
      break;

    case 0: // Dispatch event
      {
        if (payload.t === "READY") {
          const data = payload.d as { session_id: string; resume_gateway_url: string };
          sessionId = data.session_id;
          resumeGatewayUrl = data.resume_gateway_url;
          console.log("✅ Bot is ready!");
        } else if (payload.t === "MESSAGE_CREATE") {
          await handleMessageCreate(payload.d as {
            id: string;
            channel_id: string;
            guild_id?: string;
            author: { id: string; bot?: boolean; username: string };
            content: string;
          });
        }
        
        if (payload.s) {
          sequenceNumber = payload.s;
        }
      }
      break;

    case 7: // Reconnect
      console.log("🔄 Discord requested reconnect");
      break;

    case 9: // Invalid session
      console.log("❌ Invalid session, reconnecting...");
      setTimeout(() => connect(), 1000);
      break;

    case 4004: // Authentication failed
      console.error("❌ Authentication failed (4004)");
      console.error("   Possible causes:");
      console.error("   1. Bot token is invalid or incorrect");
      console.error("   2. Gateway intents not enabled in Discord Developer Portal");
      console.error("   3. Bot needs to have intents enabled even if non-privileged");
      console.error("   Fix: Go to Discord Developer Portal → Bot → Enable 'MESSAGE CONTENT INTENT' if needed");
      break;
  }
}

/**
 * Handle MESSAGE_CREATE event
 */
async function handleMessageCreate(message: {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: { id: string; bot?: boolean; username: string };
  content: string;
}): Promise<void> {
  // Ignore messages from bots (including ourselves)
  if (message.author.bot) {
    return;
  }

  // Only respond in the configured guild
  if (message.guild_id !== DISCORD_GUILD_ID) {
    return;
  }

  // Get channel info to check if it's #bot-testing
  try {
    const channelResponse = await fetch(
      `https://discord.com/api/channels/${message.channel_id}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!channelResponse.ok) {
      return;
    }

    const channel = await channelResponse.json() as { name: string; type: number };
    
    // Check if channel is #bot-testing (type 0 = text channel)
    if (channel.type === 0 && channel.name === "bot-testing") {
      // Send hello response
      await fetch(
        `https://discord.com/api/channels/${message.channel_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "hello",
          }),
        }
      );
      
      console.log(`👋 Responded to message from ${message.author.username} in #bot-testing`);
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
}

/**
 * Connect to Discord Gateway
 */
export async function connect(): Promise<void> {
  try {
    const gatewayUrl = resumeGatewayUrl || await getGatewayUrl();
    const wsUrl = `${gatewayUrl}?v=10&encoding=json`;

    console.log("🔌 Connecting to Discord Gateway...");
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket connection opened");
    };

    ws.onmessage = (event) => {
      handleGatewayMessage(event).catch((error) => {
        console.error("Error handling gateway message:", error);
      });
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      // Attempt to reconnect if not a clean close
      if (event.code !== 1000) {
        console.log("🔄 Attempting to reconnect in 5 seconds...");
        setTimeout(() => connect(), 5000);
      }
    };
  } catch (error) {
    console.error("❌ Error connecting to Gateway:", error);
    setTimeout(() => connect(), 5000);
  }
}

/**
 * Disconnect from Gateway
 */
export function disconnect(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (ws) {
    ws.close(1000, "Shutting down");
    ws = null;
  }
}

