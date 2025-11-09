import { getUserById, updateUserTimezone } from "../database.ts";
import { isValidTimezone } from "../utils/timezone.ts";
import { ValidationError, AuthenticationError, NotFoundError, handleError } from "../utils/errors.ts";

export async function handleUsersRequest(request: Request, userId: number | null): Promise<Response> {
  try {
    if (!userId) {
      throw new AuthenticationError();
    }

    const method = request.method;

    if (method === "GET") {
      // Get current user
      const user = getUserById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      return new Response(JSON.stringify(user), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (method === "PUT") {
      // Update user (timezone)
      const body = await request.json();
      const { timezone } = body;

      if (!timezone || typeof timezone !== 'string') {
        throw new ValidationError("timezone is required");
      }

      if (!isValidTimezone(timezone)) {
        throw new ValidationError("Invalid timezone");
      }

      updateUserTimezone(userId, timezone);
      const user = getUserById(userId);

      if (!user) {
        throw new NotFoundError("User");
      }

      return new Response(JSON.stringify(user), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

