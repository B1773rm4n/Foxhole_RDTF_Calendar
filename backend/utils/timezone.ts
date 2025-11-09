/**
 * Timezone conversion utilities
 * All times are stored in UTC in the database
 */

/**
 * Convert a UTC datetime string to a specific timezone
 */
export function convertUTCToTimezone(utcDateTime: string, timezone: string): Date {
  // Parse UTC datetime
  const utcDate = new Date(utcDateTime);
  
  // Convert to target timezone using Intl API
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Get parts in target timezone
  const parts = formatter.formatToParts(utcDate);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Convert a datetime in a specific timezone to UTC
 * This function takes a datetime string (YYYY-MM-DDTHH:mm) that represents a time in a specific timezone
 * and converts it to UTC ISO string
 */
export function convertTimezoneToUTC(dateTime: string, timezone: string): string {
  // Parse the datetime string (assumed format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss)
  const [datePart, timePart] = dateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const timeParts = (timePart || '').split(':');
  const hour = parseInt(timeParts[0] || '0');
  const minute = parseInt(timeParts[1] || '0');
  const second = parseInt(timeParts[2] || '0');
  
  // Use a more reliable method: create a date in the target timezone and find its UTC equivalent
  // We'll use an iterative approach to find the correct UTC time
  
  // Start with a guess: treat the input as UTC
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  
  // Format this guess in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Iterate to find the correct UTC time (max 3 iterations should be enough)
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(guess);
    const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const tzSecond = parseInt(parts.find(p => p.type === 'second')?.value || '0');
    
    // Check if we have a match
    if (tzYear === year && tzMonth === month && tzDay === day && 
        tzHour === hour && tzMinute === minute && tzSecond === second) {
      return guess.toISOString();
    }
    
    // Calculate the difference and adjust
    const diffHours = hour - tzHour;
    const diffMinutes = minute - tzMinute;
    const diffSeconds = second - tzSecond;
    const totalDiffMs = (diffHours * 3600 + diffMinutes * 60 + diffSeconds) * 1000;
    
    guess = new Date(guess.getTime() - totalDiffMs);
  }
  
  return guess.toISOString();
}

/**
 * Format a UTC datetime string for display in a specific timezone
 */
export function formatDateTimeForTimezone(utcDateTime: string, timezone: string, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const date = new Date(utcDateTime);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  if (format === 'date') {
    options.hour = undefined;
    options.minute = undefined;
  } else if (format === 'time') {
    options.year = undefined;
    options.month = undefined;
    options.day = undefined;
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get list of common timezones
 */
export function getCommonTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
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

