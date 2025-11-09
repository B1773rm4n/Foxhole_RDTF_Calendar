import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  isValidEmail,
  isValidTimezone,
  isValidDateTime,
  isValidDateTimeLocal,
  isValidTimeRange,
  sanitizeString,
  isValidId,
  isValidDiscordId,
  isValidUsername,
  isValidDescription,
  isValidDateRange
} from "../backend/utils/validation.ts";

Deno.test("Email validation", () => {
  assertEquals(isValidEmail("test@example.com"), true);
  assertEquals(isValidEmail("user.name@domain.co.uk"), true);
  assertEquals(isValidEmail("invalid"), false);
  assertEquals(isValidEmail("test@"), false);
  assertEquals(isValidEmail("@example.com"), false);
});

Deno.test("Timezone validation", () => {
  assertEquals(isValidTimezone("UTC"), true);
  assertEquals(isValidTimezone("America/New_York"), true);
  assertEquals(isValidTimezone("Europe/London"), true);
  assertEquals(isValidTimezone("Invalid/Timezone"), false);
  assertEquals(isValidTimezone(""), false);
});

Deno.test("DateTime validation", () => {
  assertEquals(isValidDateTime("2024-01-01T10:00:00Z"), true);
  assertEquals(isValidDateTime("2024-01-01T10:00:00"), true);
  assertEquals(isValidDateTime("2024-01-01T10:00"), false); // Missing seconds
  assertEquals(isValidDateTime("invalid"), false);
  assertEquals(isValidDateTime(""), false);
});

Deno.test("DateTime-local validation", () => {
  assertEquals(isValidDateTimeLocal("2024-01-01T10:00"), true);
  assertEquals(isValidDateTimeLocal("2024-12-31T23:59"), true);
  assertEquals(isValidDateTimeLocal("2024-01-01T10:00:00"), false); // Has seconds
  assertEquals(isValidDateTimeLocal("invalid"), false);
});

Deno.test("Time range validation", () => {
  assertEquals(isValidTimeRange("2024-01-01T10:00:00Z", "2024-01-01T18:00:00Z"), true);
  assertEquals(isValidTimeRange("2024-01-01T10:00:00Z", "2024-01-01T09:00:00Z"), false); // End before start
  assertEquals(isValidTimeRange("2024-01-01T10:00:00Z", "2024-01-01T10:00:00Z"), false); // Same time
  assertEquals(isValidTimeRange("invalid", "2024-01-01T18:00:00Z"), false);
});

Deno.test("String sanitization", () => {
  assertEquals(sanitizeString("Hello World"), "Hello World");
  assertEquals(sanitizeString("<script>alert('xss')</script>"), "scriptalert('xss')/script");
  assertEquals(sanitizeString("  spaced  "), "spaced");
  
  const longString = "a".repeat(2000);
  const sanitized = sanitizeString(longString, 1000);
  assertEquals(sanitized.length, 1000);
});

Deno.test("ID validation", () => {
  assertEquals(isValidId(1), true);
  assertEquals(isValidId(123), true);
  assertEquals(isValidId("123"), true);
  assertEquals(isValidId(0), false);
  assertEquals(isValidId(-1), false);
  assertEquals(isValidId("abc"), false);
  assertEquals(isValidId(null), false);
});

Deno.test("Discord ID validation", () => {
  assertEquals(isValidDiscordId("12345678901234567"), true); // 17 digits
  assertEquals(isValidDiscordId("123456789012345678"), true); // 18 digits
  assertEquals(isValidDiscordId("1234567890123456789"), true); // 19 digits
  assertEquals(isValidDiscordId("1234567890123456"), false); // 16 digits
  assertEquals(isValidDiscordId("abc"), false);
  assertEquals(isValidDiscordId(""), false);
});

Deno.test("Username validation", () => {
  assertEquals(isValidUsername("testuser"), true);
  assertEquals(isValidUsername("user_123"), true);
  assertEquals(isValidUsername("user-name"), true);
  assertEquals(isValidUsername("a"), false); // Too short
  assertEquals(isValidUsername("a".repeat(33)), false); // Too long
  assertEquals(isValidUsername("user@name"), false); // Invalid char
  assertEquals(isValidUsername(""), false);
});

Deno.test("Description validation", () => {
  assertEquals(isValidDescription(null), true);
  assertEquals(isValidDescription(undefined), true);
  assertEquals(isValidDescription("Short description"), true);
  assertEquals(isValidDescription("a".repeat(5000)), true);
  assertEquals(isValidDescription("a".repeat(5001)), false);
  assertEquals(isValidDescription("123"), true); // String is valid
});

Deno.test("Date range validation", () => {
  assertEquals(isValidDateRange("2024-01-01T00:00:00Z", "2024-01-31T23:59:59Z"), true);
  assertEquals(isValidDateRange("2024-01-31T23:59:59Z", "2024-01-01T00:00:00Z"), false); // End before start
  assertEquals(isValidDateRange(null, "2024-01-31T23:59:59Z"), true);
  assertEquals(isValidDateRange("2024-01-01T00:00:00Z", null), true);
  assertEquals(isValidDateRange(null, null), true);
  assertEquals(isValidDateRange("invalid", "2024-01-31T23:59:59Z"), false);
});

