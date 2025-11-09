/**
 * Input validation and sanitization utilities
 */

/**
 * Validate email format (for future use)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate datetime string format (ISO 8601)
 */
export function isValidDateTime(dateTime: string): boolean {
  if (!dateTime || typeof dateTime !== 'string') {
    return false;
  }
  
  // Check ISO 8601 format: YYYY-MM-DDTHH:mm:ss (seconds required)
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
  if (!isoRegex.test(dateTime)) {
    return false;
  }
  
  const date = new Date(dateTime);
  return !isNaN(date.getTime());
}

/**
 * Validate datetime-local format (YYYY-MM-DDTHH:mm)
 */
export function isValidDateTimeLocal(dateTime: string): boolean {
  if (!dateTime || typeof dateTime !== 'string') {
    return false;
  }
  
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!regex.test(dateTime)) {
    return false;
  }
  
  const date = new Date(dateTime);
  return !isNaN(date.getTime());
}

/**
 * Validate that end time is after start time
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidDateTime(startTime) || !isValidDateTime(endTime)) {
    return false;
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return end > start;
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate integer ID
 */
export function isValidId(id: unknown): id is number {
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0;
  }
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return !isNaN(parsed) && parsed > 0;
  }
  return false;
}

/**
 * Validate Discord ID format
 */
export function isValidDiscordId(id: string): boolean {
  // Discord IDs are 17-19 digit numbers
  const discordIdRegex = /^\d{17,19}$/;
  return discordIdRegex.test(id);
}

/**
 * Validate username (alphanumeric, underscore, hyphen, 2-32 chars)
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  const usernameRegex = /^[a-zA-Z0-9_-]{2,32}$/;
  return usernameRegex.test(username);
}

/**
 * Validate description length
 */
export function isValidDescription(description: string | null | undefined): boolean {
  if (description === null || description === undefined) {
    return true; // Optional field
  }
  
  if (typeof description !== 'string') {
    return false;
  }
  
  return description.length <= 5000; // Max 5000 characters
}

/**
 * Validate date range for queries
 */
export function isValidDateRange(startDate: string | null, endDate: string | null): boolean {
  if (startDate && !isValidDateTime(startDate)) {
    return false;
  }
  
  if (endDate && !isValidDateTime(endDate)) {
    return false;
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end >= start;
  }
  
  return true;
}

