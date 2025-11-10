# Discord Bot for Foxhole Calendar

This bot provides role checking functionality for the Foxhole Calendar authentication system.

## Overview

The bot is designed to:
- Verify Discord users have the required role in the specified server
- Provide role checking services to the backend authentication system
- Can be run as a standalone service for testing and verification

## Setup

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Select your application (or create a new one)
3. Go to "Bot" section
4. Click "Add Bot" or use existing bot
5. Copy the bot token

### 2. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`
3. Select bot permissions:
   - **Read Members** (or "View Server Members")
   - **View Channels** (optional, for future features)
4. Copy the generated URL and open it in a browser
5. Select your server and authorize

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=1436299636963938355
DISCORD_REQUIRED_ROLE=Member
```

## Usage

### Test Bot Connection

```bash
deno task bot:test
```

This will:
- Verify bot token is valid
- Check bot can access the configured guild
- Verify the required role exists
- List available roles

### Run Bot (Standalone)

```bash
deno task bot:start
```

This starts the bot as a standalone service. Currently, it only verifies connectivity and keeps running.

### Use in Backend

The backend authentication system (`backend/auth.ts`) uses the `role_checker.ts` module directly via API calls. No separate bot process is required for authentication to work.

## Architecture

```
bot/
├── main.ts          # Bot entry point (standalone service)
├── role_checker.ts  # Role checking functions (used by backend)
└── README.md        # This file
```

### `role_checker.ts`

Provides functions that can be used by the backend:
- `checkUserHasRole(userId, roleName)` - Check if user has specific role
- `checkUserInGuild(userId)` - Check if user is in the guild
- `getUserRoles(userId)` - Get all roles for a user

### `main.ts`

Standalone bot service that:
- Verifies bot configuration
- Tests bot connection and permissions
- Can be extended with Discord event listeners

## Integration with Backend

The backend (`backend/auth.ts`) uses the bot token directly via HTTP API calls to Discord. The `role_checker.ts` module provides a clean interface for this.

**Note:** The bot doesn't need to be running as a separate process for authentication to work. The backend makes direct API calls using the bot token.

## Permissions Required

The bot needs the following permissions in your Discord server:

- **Read Members** / **View Server Members** - To check user roles
- Must be in the server
- Must have access to view roles

## Troubleshooting

### Bot Token Invalid

- Verify token is correct in `.env`
- Check token hasn't been regenerated in Discord Developer Portal
- Ensure no extra spaces or quotes in token

### Cannot Access Guild

- Verify bot is in the server
- Check `DISCORD_GUILD_ID` is correct
- Ensure bot has proper permissions

### Role Not Found

- Verify role name is exact (case-sensitive)
- Check role exists in server settings
- List available roles using `deno task bot:test`

### Backend Can't Check Roles

- Verify `DISCORD_BOT_TOKEN` is set in backend environment
- Check backend has network access to Discord API
- Review backend logs for specific error messages

## Future Enhancements

Potential features to add:
- Discord slash commands for calendar management
- Event listeners for role changes
- Notifications for shift reminders
- Integration with Discord calendar embeds

## Security Notes

- **Never commit bot token to git**
- Keep `.env` file secure
- Bot token has access to your server - treat it as sensitive
- Rotate token if compromised

