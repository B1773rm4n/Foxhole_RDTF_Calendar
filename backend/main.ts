import { initDatabase } from "./database.ts";
import { getDiscordAuthUrl, handleDiscordCallback, getSessionTokenFromRequest, getUserIdFromSession, deleteSession } from "./auth.ts";
import { handleShiftsRequest, handleShiftRequest } from "./api/shifts.ts";
import { handleUsersRequest } from "./api/users.ts";
import { handleCalendarRequest } from "./api/calendar.ts";
import { getUserById } from "./database.ts";
import { getSecurityHeaders, checkRateLimit, getClientIP } from "./utils/security.ts";

// Initialize database
initDatabase();

const PORT = parseInt(Deno.env.get("PORT") || "9624");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Combine security headers with CORS
function getResponseHeaders(): Record<string, string> {
  return {
    ...corsHeaders,
    ...getSecurityHeaders(),
  };
}

function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: getResponseHeaders(),
  });
}

async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleOptions();
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const clientIP = getClientIP(request);
  const headers = getResponseHeaders();

  // Rate limiting for API endpoints
  if (path.startsWith("/api/")) {
    let rateLimitType: "auth" | "api" | "shifts" = "api";
    
    if (path.startsWith("/api/auth/")) {
      rateLimitType = "auth";
    } else if (path.startsWith("/api/shifts")) {
      rateLimitType = "shifts";
    }
    
    if (!checkRateLimit(clientIP, rateLimitType)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  }

  // Serve static files
  if (path.startsWith("/css/") || path.startsWith("/js/")) {
    try {
      const filePath = `frontend${path}`;
      const file = await Deno.readFile(filePath);
      const contentType = path.endsWith(".css") ? "text/css" : "application/javascript";
      return new Response(file, {
        headers: { ...headers, "Content-Type": contentType },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  // Serve HTML files
  if (path === "/" || path === "/index.html") {
    try {
      const file = await Deno.readFile("frontend/index.html");
      return new Response(file, {
        headers: { ...headers, "Content-Type": "text/html" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (path === "/login.html") {
    try {
      const file = await Deno.readFile("frontend/login.html");
      return new Response(file, {
        headers: { ...headers, "Content-Type": "text/html" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  // API routes
  if (path.startsWith("/api/")) {
    // Get user from session
    const sessionToken = getSessionTokenFromRequest(request);
    const userId = sessionToken ? getUserIdFromSession(sessionToken) : null;

    // Auth endpoints (don't require authentication)
    if (path === "/api/auth/discord") {
      const authUrl = getDiscordAuthUrl();
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (path === "/api/auth/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        // Redirect to login with error
        return new Response(null, {
          status: 302,
          headers: { ...headers, "Location": "/login.html?error=missing_code" },
        });
      }

      try {
        const { sessionToken } = await handleDiscordCallback(code);
        
        // Redirect to main page with session cookie (3 days = 259200 seconds)
        const response = new Response(null, {
          status: 302,
          headers: { 
            ...headers, 
            "Location": "/",
            "Set-Cookie": `session=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${3 * 24 * 60 * 60}`
          },
        });
        
        return response;
      } catch (error) {
        // Redirect to login with error
        const errorMessage = error instanceof Error ? error.message : "Authentication failed";
        return new Response(null, {
          status: 302,
          headers: { ...headers, "Location": `/login.html?error=${encodeURIComponent(errorMessage)}` },
        });
      }
    }

    if (path === "/api/auth/me") {
      if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
      }

      const user = getUserById(userId);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user, authenticated: true }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (path === "/api/auth/logout" && request.method === "POST") {
      if (sessionToken) {
        deleteSession(sessionToken);
      }
      const response = new Response(JSON.stringify({ success: true }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
      response.headers.set("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
      return response;
    }

    // Shifts endpoints
    if (path === "/api/shifts") {
      return handleShiftsRequest(request, userId);
    }

    if (path.startsWith("/api/shifts/")) {
      const shiftId = path.split("/")[3];
      return handleShiftRequest(request, userId, shiftId);
    }

    // Users endpoints
    if (path === "/api/users" || path === "/api/users/me") {
      return handleUsersRequest(request, userId);
    }

    // Calendar endpoints
    if (path === "/api/calendar") {
      return handleCalendarRequest(request, userId);
    }
  }

  return new Response("Not found", {
    status: 404,
    headers: headers,
  });
}

console.log(`Server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);

