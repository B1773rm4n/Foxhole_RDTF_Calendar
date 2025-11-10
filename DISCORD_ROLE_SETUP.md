# Discord Role-Based Access Control Setup

## Overview

The application can restrict access to users who have a specific role in a Discord server. This requires configuring environment variables and optionally setting up a Discord bot.

## Quick Setup

### Option 1: Using Bot Token (Recommended)

This is the easiest and most reliable method:

1. **Create a Discord Bot:**
   - Go to https://discord.com/developers/applications
   - Select your application (or create a new one)
   - Go to "Bot" section
   - Click "Add Bot" or use existing bot
   - Copy the bot token

2. **Invite Bot to Your Server:**
   - Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`
   - Select bot permissions: `Read Members` (or `View Server Members`)
   - Copy the generated URL and open it in a browser
   - Select your server and authorize

3. **Add to .env:**
   ```bash
   DISCORD_GUILD_ID=1436299636963938355
   DISCORD_REQUIRED_ROLE=Member
   DISCORD_BOT_TOKEN=your_bot_token_here
   ```

### Option 2: Using OAuth Scopes (No Bot Required)

If you don't want to use a bot, you can use OAuth scopes:

1. **Update Discord OAuth Scopes:**
   - In Discord Developer Portal → OAuth2
   - Add scope: `guilds.members.read`
   - **Note:** This is a privileged scope and may require approval

2. **Add to .env:**
   ```bash
   DISCORD_GUILD_ID=1436299636963938355
   DISCORD_REQUIRED_ROLE=Member
   # No DISCORD_BOT_TOKEN needed
   ```

## Environment Variables

Add these to your `.env` file:

```bash
# Required for role checking
DISCORD_GUILD_ID=1436299636963938355
DISCORD_REQUIRED_ROLE=Member

# Optional but recommended (uses bot token instead of OAuth)
DISCORD_BOT_TOKEN=your_bot_token_here
```

## How It Works

1. **User logs in via Discord OAuth**
2. **System checks if user is in the required guild** (server)
3. **System checks if user has the required role**
4. **If both checks pass**, user is authenticated
5. **If checks fail**, user sees an error message

## Finding Your Guild ID

1. Enable Developer Mode in Discord:
   - Settings → Advanced → Developer Mode
2. Right-click on your server name
3. Click "Copy Server ID"
4. Use that ID for `DISCORD_GUILD_ID`

## Finding Role Names

Role names are case-sensitive. Common role names:
- `Member`
- `Members`
- `@everyone` (default role, everyone has it)

To find exact role names:
1. Go to Server Settings → Roles
2. Check the exact name (case-sensitive)

## Bot Permissions Required

If using bot token, the bot needs:
- **Read Members** permission (or "View Server Members")
- Must be in the server
- Must have access to view roles

## Testing

After setup:

1. **Restart backend:**
   ```bash
   sudo systemctl restart foxhole-calendar
   ```

2. **Test with a user who has the role:**
   - Should be able to login successfully

3. **Test with a user who doesn't have the role:**
   - Should see error: "You must have the 'Member' role..."

4. **Test with a user not in the server:**
   - Should see error: "You must be a member of the required Discord server..."

## Troubleshooting

### Error: "Role 'Member' not found in guild"

- Check role name is exact (case-sensitive)
- Verify bot has permission to view roles
- Check bot is in the server

### Error: "User not in guild"

- Verify `DISCORD_GUILD_ID` is correct
- Check user is actually in the server
- Verify OAuth scopes include `guilds`

### Bot Token Not Working

- Verify bot token is correct
- Check bot is in the server
- Verify bot has "Read Members" permission
- Check bot hasn't been removed from server

### OAuth Method Not Working

- Verify `guilds.members.read` scope is approved (may require Discord approval)
- Check OAuth scopes in Developer Portal
- Verify user authorized the scopes during login

## Security Notes

- **Bot Token:** Keep it secret! Never commit to git
- **Guild ID:** Can be public (it's just a server identifier)
- **Role Name:** Can be public (it's just a name)

## Disabling Role Check

To disable role checking, simply don't set `DISCORD_GUILD_ID` in your `.env` file, or remove it. The application will work without restrictions.


