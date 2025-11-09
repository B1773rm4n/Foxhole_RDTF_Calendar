import { getShifts, getShiftById, createShift, updateShift, deleteShift } from "../database.ts";
import { convertTimezoneToUTC, formatDateTimeForTimezone, isValidTimezone } from "../utils/timezone.ts";
import { 
  isValidDateTimeLocal, 
  isValidTimeRange, 
  isValidDescription, 
  isValidDateRange,
  sanitizeString 
} from "../utils/validation.ts";
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  handleError 
} from "../utils/errors.ts";

export async function handleShiftsRequest(request: Request, userId: number | null): Promise<Response> {
  try {
    if (!userId) {
      throw new AuthenticationError();
    }

    const url = new URL(request.url);
    const method = request.method;

    if (method === "GET") {
      // Get shifts
      const startDate = url.searchParams.get("start");
      const endDate = url.searchParams.get("end");
      const timezone = url.searchParams.get("timezone") || "UTC";

      // Validate timezone
      if (!isValidTimezone(timezone)) {
        throw new ValidationError("Invalid timezone");
      }

      // Validate date range
      if (!isValidDateRange(startDate, endDate)) {
        throw new ValidationError("Invalid date range");
      }

      const shifts = getShifts(startDate || undefined, endDate || undefined);
      
      // Format shifts with timezone conversion
      const formattedShifts = shifts.map(shift => ({
        ...shift,
        start_time: formatDateTimeForTimezone(shift.start_time, timezone),
        end_time: formatDateTimeForTimezone(shift.end_time, timezone),
      }));

      return new Response(JSON.stringify(formattedShifts), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (method === "POST") {
      // Create shift
      const body = await request.json();
      const { start_time, end_time, description, timezone = "UTC" } = body;

      // Validate required fields
      if (!start_time || !end_time) {
        throw new ValidationError("start_time and end_time are required");
      }

      // Validate datetime format
      if (!isValidDateTimeLocal(start_time) || !isValidDateTimeLocal(end_time)) {
        throw new ValidationError("Invalid datetime format. Use YYYY-MM-DDTHH:mm");
      }

      // Validate timezone
      if (!isValidTimezone(timezone)) {
        throw new ValidationError("Invalid timezone");
      }

      // Validate time range
      if (!isValidTimeRange(start_time, end_time)) {
        throw new ValidationError("end_time must be after start_time");
      }

      // Validate description
      if (!isValidDescription(description)) {
        throw new ValidationError("Description too long (max 5000 characters)");
      }

      // Sanitize description
      const sanitizedDescription = description ? sanitizeString(description, 5000) : null;

      // Convert timezone to UTC for storage
      const startTimeUTC = convertTimezoneToUTC(start_time, timezone);
      const endTimeUTC = convertTimezoneToUTC(end_time, timezone);

      const shift = createShift(userId, startTimeUTC, endTimeUTC, sanitizedDescription);

      return new Response(JSON.stringify(shift), {
        status: 201,
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

export async function handleShiftRequest(request: Request, userId: number | null, shiftId: string): Promise<Response> {
  try {
    if (!userId) {
      throw new AuthenticationError();
    }

    const method = request.method;
    
    // Validate shift ID
    const id = parseInt(shiftId);
    if (isNaN(id) || id <= 0) {
      throw new ValidationError("Invalid shift ID");
    }

    if (method === "GET") {
      // Get single shift
      const url = new URL(request.url);
      const timezone = url.searchParams.get("timezone") || "UTC";
      
      // Validate timezone
      if (!isValidTimezone(timezone)) {
        throw new ValidationError("Invalid timezone");
      }
      
      const shift = getShiftById(id);
      if (!shift) {
        throw new NotFoundError("Shift");
      }

      const formattedShift = {
        ...shift,
        start_time: formatDateTimeForTimezone(shift.start_time, timezone),
        end_time: formatDateTimeForTimezone(shift.end_time, timezone),
      };

      return new Response(JSON.stringify(formattedShift), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (method === "PUT") {
      // Update shift
      const body = await request.json();
      const { start_time, end_time, description, timezone = "UTC" } = body;

      // Validate required fields
      if (!start_time || !end_time) {
        throw new ValidationError("start_time and end_time are required");
      }

      // Validate datetime format
      if (!isValidDateTimeLocal(start_time) || !isValidDateTimeLocal(end_time)) {
        throw new ValidationError("Invalid datetime format. Use YYYY-MM-DDTHH:mm");
      }

      // Validate timezone
      if (!isValidTimezone(timezone)) {
        throw new ValidationError("Invalid timezone");
      }

      // Validate time range
      if (!isValidTimeRange(start_time, end_time)) {
        throw new ValidationError("end_time must be after start_time");
      }

      // Validate description
      if (!isValidDescription(description)) {
        throw new ValidationError("Description too long (max 5000 characters)");
      }

      // Sanitize description
      const sanitizedDescription = description ? sanitizeString(description, 5000) : null;

      // Convert timezone to UTC for storage
      const startTimeUTC = convertTimezoneToUTC(start_time, timezone);
      const endTimeUTC = convertTimezoneToUTC(end_time, timezone);

      const shift = updateShift(id, userId, startTimeUTC, endTimeUTC, sanitizedDescription);

      if (!shift) {
        throw new NotFoundError("Shift");
      }

      return new Response(JSON.stringify(shift), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (method === "DELETE") {
      // Delete shift
      const success = deleteShift(id, userId);

      if (!success) {
        throw new NotFoundError("Shift");
      }

      return new Response(JSON.stringify({ success: true }), {
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

