import { getShifts } from "../database.ts";
import { formatDateTimeForTimezone, isValidTimezone } from "../utils/timezone.ts";
import { getUserById } from "../database.ts";
import { ValidationError, AuthenticationError, handleError } from "../utils/errors.ts";

export function handleCalendarRequest(request: Request, userId: number | null): Response {
  try {
    if (!userId) {
      throw new AuthenticationError();
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const timezone = url.searchParams.get("timezone") || "UTC";

    // Validate timezone
    if (!isValidTimezone(timezone)) {
      throw new ValidationError("Invalid timezone");
    }

    // Validate year
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new ValidationError("Invalid year (must be between 1900 and 2100)");
    }

    // Validate month
    const month = monthParam ? parseInt(monthParam) : (new Date().getMonth() + 1);
    if (isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError("Invalid month (must be between 1 and 12)");
    }

    // Calculate start and end of month in UTC
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Get shifts for the month
    const shifts = getShifts(startDateStr, endDateStr);

    // Get user info for each shift
    const shiftsWithUsers = shifts.map(shift => {
      const user = getUserById(shift.user_id);
      return {
        ...shift,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
        } : null,
        start_time: formatDateTimeForTimezone(shift.start_time, timezone),
        end_time: formatDateTimeForTimezone(shift.end_time, timezone),
      };
    });

    return new Response(JSON.stringify({
      year,
      month,
      shifts: shiftsWithUsers,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

