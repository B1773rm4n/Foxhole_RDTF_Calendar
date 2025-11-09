import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  initDatabase, 
  closeDatabase, 
  createUser, 
  getUserByDiscordId, 
  getUserById,
  createShift,
  getShiftById,
  getShifts,
  updateShift,
  deleteShift,
  updateUserTimezone
} from "../backend/database.ts";

// Use test database
const TEST_DB_PATH = "database/test_calendar.db";

// Cleanup helper
function cleanupTestDb() {
  try {
    Deno.removeSync(TEST_DB_PATH);
  } catch {
    // Ignore if doesn't exist
  }
  closeDatabase();
}

Deno.test("Database initialization", () => {
  cleanupTestDb();
  const db = initDatabase(TEST_DB_PATH);
  assertExists(db);
  cleanupTestDb();
});

Deno.test("User creation and retrieval", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("123456789", "testuser", "https://example.com/avatar.png");
  assertExists(user);
  assertEquals(user.discord_id, "123456789");
  assertEquals(user.username, "testuser");
  
  const retrieved = getUserByDiscordId("123456789");
  assertExists(retrieved);
  assertEquals(retrieved?.id, user.id);
  
  const byId = getUserById(user.id);
  assertExists(byId);
  assertEquals(byId?.username, "testuser");
  
  cleanupTestDb();
});

Deno.test("User timezone update", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("987654321", "testuser2", null);
  updateUserTimezone(user.id, "America/New_York");
  
  const updated = getUserById(user.id);
  assertExists(updated);
  assertEquals(updated?.timezone, "America/New_York");
  
  cleanupTestDb();
});

Deno.test("Shift creation and retrieval", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("111222333", "shiftuser", null);
  const startTime = "2024-01-01T10:00:00Z";
  const endTime = "2024-01-01T18:00:00Z";
  
  const shift = createShift(user.id, startTime, endTime, "Test shift");
  assertExists(shift);
  assertEquals(shift.user_id, user.id);
  assertEquals(shift.start_time, startTime);
  assertEquals(shift.end_time, endTime);
  assertEquals(shift.description, "Test shift");
  
  const retrieved = getShiftById(shift.id);
  assertExists(retrieved);
  assertEquals(retrieved?.id, shift.id);
  
  cleanupTestDb();
});

Deno.test("Get shifts with date range", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("444555666", "rangeuser", null);
  const start1 = "2024-01-15T09:00:00Z";
  const end1 = "2024-01-15T17:00:00Z";
  const start2 = "2024-02-15T09:00:00Z";
  const end2 = "2024-02-15T17:00:00Z";
  
  createShift(user.id, start1, end1, "January shift");
  createShift(user.id, start2, end2, "February shift");
  
  const janShifts = getShifts("2024-01-01T00:00:00Z", "2024-01-31T23:59:59Z");
  assertEquals(janShifts.length, 1);
  assertEquals(janShifts[0].description, "January shift");
  
  const allShifts = getShifts();
  assert(allShifts.length >= 2);
  
  cleanupTestDb();
});

Deno.test("Shift update", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("777888999", "updateuser", null);
  const shift = createShift(user.id, "2024-03-01T10:00:00Z", "2024-03-01T18:00:00Z", "Original");
  
  const updated = updateShift(shift.id, user.id, "2024-03-01T11:00:00Z", "2024-03-01T19:00:00Z", "Updated");
  assertExists(updated);
  assertEquals(updated?.start_time, "2024-03-01T11:00:00Z");
  assertEquals(updated?.description, "Updated");
  
  cleanupTestDb();
});

Deno.test("Shift delete", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user = createUser("999888777", "deleteuser", null);
  const shift = createShift(user.id, "2024-04-01T10:00:00Z", "2024-04-01T18:00:00Z", "To delete");
  
  const success = deleteShift(shift.id, user.id);
  assertEquals(success, true);
  
  const deleted = getShiftById(shift.id);
  assertEquals(deleted, null);
  
  cleanupTestDb();
});

Deno.test("Shift ownership validation", () => {
  cleanupTestDb();
  initDatabase(TEST_DB_PATH);
  
  const user1 = createUser("111111111", "owner1", null);
  const user2 = createUser("222222222", "owner2", null);
  const shift = createShift(user1.id, "2024-05-01T10:00:00Z", "2024-05-01T18:00:00Z", "Owned by user1");
  
  // User2 cannot update user1's shift
  const updated = updateShift(shift.id, user2.id, "2024-05-01T11:00:00Z", "2024-05-01T19:00:00Z", "Hacked");
  assertEquals(updated, null);
  
  // User2 cannot delete user1's shift
  const deleted = deleteShift(shift.id, user2.id);
  assertEquals(deleted, false);
  
  cleanupTestDb();
});

