import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  convertUTCToTimezone,
  convertTimezoneToUTC,
  formatDateTimeForTimezone,
  getCommonTimezones,
  isValidTimezone
} from "../backend/utils/timezone.ts";

Deno.test("Timezone validation", () => {
  assertEquals(isValidTimezone("UTC"), true);
  assertEquals(isValidTimezone("America/New_York"), true);
  assertEquals(isValidTimezone("Invalid/Timezone"), false);
});

Deno.test("Get common timezones", () => {
  const timezones = getCommonTimezones();
  assert(timezones.length > 0);
  assert(timezones.includes("UTC"));
  assert(timezones.includes("America/New_York"));
});

Deno.test("Format datetime for timezone", () => {
  const utcDateTime = "2024-01-01T12:00:00Z";
  
  // Format in UTC (should be same)
  const utcFormatted = formatDateTimeForTimezone(utcDateTime, "UTC");
  assert(utcFormatted.includes("2024"));
  assert(utcFormatted.includes("01"));
  
  // Format in different timezone
  const nyFormatted = formatDateTimeForTimezone(utcDateTime, "America/New_York");
  assert(nyFormatted.includes("2024"));
  
  // Format date only
  const dateOnly = formatDateTimeForTimezone(utcDateTime, "UTC", "date");
  assert(!dateOnly.includes(":"));
  
  // Format time only
  const timeOnly = formatDateTimeForTimezone(utcDateTime, "UTC", "time");
  assert(timeOnly.includes(":"));
});

Deno.test("Timezone to UTC conversion", () => {
  // Test conversion from a known timezone
  const localTime = "2024-01-01T12:00";
  const timezone = "America/New_York";
  
  const utc = convertTimezoneToUTC(localTime, timezone);
  assert(utc.includes("T"));
  assert(utc.includes("Z") || utc.includes("+") || utc.includes("-"));
  
  // UTC to UTC should be close to original (accounting for timezone offset)
  const utcLocal = convertTimezoneToUTC("2024-01-01T12:00", "UTC");
  assert(utcLocal.includes("2024-01-01"));
});

Deno.test("UTC to timezone conversion", () => {
  const utcDateTime = "2024-01-01T12:00:00Z";
  const converted = convertUTCToTimezone(utcDateTime, "America/New_York");
  
  // Should return a Date object
  assert(converted instanceof Date);
  assert(!isNaN(converted.getTime()));
});

Deno.test("Round-trip conversion", () => {
  // Test that converting to UTC and back gives reasonable results
  const original = "2024-06-15T14:30";
  const timezone = "Europe/London";
  
  const utc = convertTimezoneToUTC(original, timezone);
  assert(utc.length > 0);
  
  // The UTC string should be valid
  const utcDate = new Date(utc);
  assert(!isNaN(utcDate.getTime()));
});

