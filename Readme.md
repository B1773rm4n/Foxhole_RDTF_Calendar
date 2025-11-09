Foxhole RotDust Calendar
==========================

This is a webapp. It's purpose is to be a sort of calendar which visualizes when someone takes the responsibility for a shift. It supports different timezones and uses a login via Discord.


Frontend
---------

It uses plain HTML and CSS and Javascript without any external libraries or frameworks


Backend
--------

Written in Deno JS. For user management it uses sqlite


Login
-------

It uses Discords login system to verify the username and handles the user state management based on that input




Setup and Installation
======================

Prerequisites
-------------
- Deno 2.2 or higher (https://deno.land/) - Required for FFI support (`--allow-ffi --unstable-ffi`)
- Discord OAuth Application (for authentication)

Installing Dependencies
-----------------------
This project uses `@db/sqlite` from JSR (JavaScript Registry). Dependencies are automatically downloaded when you run the application or tests. No manual installation is required.

**Note**: Deno 2.2 or higher is required for FFI support. If you're on an older version, upgrade with:
```bash
deno upgrade
```

The application requires the following Deno permissions:
- `--allow-net` - Network access for HTTP server and Discord OAuth
- `--allow-read` - Read database schema and static files
- `--allow-write` - Write to SQLite database
- `--allow-env` - Access environment variables
- `--allow-ffi` - Foreign Function Interface for SQLite (required by `@db/sqlite`)
- `--unstable-ffi` - Enable unstable FFI features

Environment Variables
---------------------
Create a `.env` file or set the following environment variables:

```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:8000/api/auth/callback
SESSION_SECRET=your_random_secret_key
PORT=8000  # Optional, defaults to 8000
```

Discord OAuth Setup
-------------------
1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URI: `http://localhost:8000/api/auth/callback`
5. Copy Client ID and Client Secret to environment variables

Running the Application
-----------------------

**Full Stack (Backend + Frontend):**
```bash
deno task dev
```
This starts the backend server which also serves the frontend files. The application will be available at `http://localhost:8000`

**Frontend Only (Development):**
For frontend-only development with a lightweight static file server:
```bash
deno task dev:frontend
```
This starts a simple file server on `http://localhost:3000` serving only the frontend files. Useful for frontend development without the backend.

**Production:**
```bash
deno task start
```
Starts the production server at `http://localhost:8000`


Testing
=======

Run all tests:
```bash
deno task test
```

Run tests in watch mode:
```bash
deno task test:watch
```

**Note**: Tests use a separate test database (`database/test_calendar.db`) that is automatically cleaned up between test runs. The database module supports custom database paths for testing isolation.

See `tests/README.md` for more details.


API Endpoints
=============

Authentication
--------------
- `GET /api/auth/discord` - Get Discord OAuth URL
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

Shifts
------
- `GET /api/shifts?start=DATE&end=DATE&timezone=TZ` - Get shifts in date range
- `POST /api/shifts` - Create new shift
- `GET /api/shifts/:id` - Get specific shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

Users
-----
- `GET /api/users` - Get current user
- `PUT /api/users` - Update user (timezone)

Calendar
--------
- `GET /api/calendar?year=YEAR&month=MONTH&timezone=TZ` - Get calendar data