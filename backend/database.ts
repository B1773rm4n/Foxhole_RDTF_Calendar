import { Database } from "jsr:@db/sqlite@0.12";

let db: Database | null = null;
let dbPath: string | null = null;

export function initDatabase(customPath?: string): Database {
  const path = customPath || "database/calendar.db";
  
  // If database is already initialized with the same path, return it
  if (db && dbPath === path) {
    return db;
  }
  
  // Close existing database if path changed
  if (db && dbPath !== path) {
    db.close();
    db = null;
  }

  dbPath = path;
  db = new Database(path);
  
  // Read and execute schema
  const schema = Deno.readTextFileSync("database/schema.sql");
  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(s => s.trim().length > 0);
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement.trim());
    }
  }
  
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    dbPath = null;
  }
}

// User queries
export interface User {
  id: number;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export function getUserByDiscordId(discordId: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT id, discord_id, username, avatar_url, timezone, created_at FROM users WHERE discord_id = ?");
  const result = stmt.all(discordId);
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0] as Record<string, unknown>;
  return {
    id: row.id as number,
    discord_id: row.discord_id as string,
    username: row.username as string,
    avatar_url: row.avatar_url as string | null,
    timezone: row.timezone as string,
    created_at: row.created_at as string,
  };
}

export function createUser(discordId: string, username: string, avatarUrl: string | null): User {
  const db = getDatabase();
  const stmt = db.prepare("INSERT INTO users (discord_id, username, avatar_url) VALUES (?, ?, ?)");
  stmt.run(discordId, username, avatarUrl);
  
  const user = getUserByDiscordId(discordId);
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

export function updateUserTimezone(userId: number, timezone: string): void {
  const db = getDatabase();
  const stmt = db.prepare("UPDATE users SET timezone = ? WHERE id = ?");
  stmt.run(timezone, userId);
}

// Session queries
export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export function createSession(userId: number, token: string, expiresAt: Date): void {
  const db = getDatabase();
  const stmt = db.prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)");
  stmt.run(userId, token, expiresAt.toISOString());
}

export function getSessionByToken(token: string): Session | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = ? AND expires_at > datetime('now')");
  const result = stmt.all(token);
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0] as Record<string, unknown>;
  return {
    id: row.id as number,
    user_id: row.user_id as number,
    token: row.token as string,
    expires_at: row.expires_at as string,
    created_at: row.created_at as string,
  };
}

export function deleteSession(token: string): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM sessions WHERE token = ?");
  stmt.run(token);
}

export function deleteExpiredSessions(): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");
  stmt.run();
}

export function deleteUserSessions(userId: number): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  stmt.run(userId);
}

export function getUserById(userId: number): User | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT id, discord_id, username, avatar_url, timezone, created_at FROM users WHERE id = ?");
  const result = stmt.all(userId);
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0] as Record<string, unknown>;
  return {
    id: row.id as number,
    discord_id: row.discord_id as string,
    username: row.username as string,
    avatar_url: row.avatar_url as string | null,
    timezone: row.timezone as string,
    created_at: row.created_at as string,
  };
}

// Shift queries
export interface Shift {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function getShifts(startDate?: string, endDate?: string): Shift[] {
  const db = getDatabase();
  let query = "SELECT id, user_id, start_time, end_time, description, created_at, updated_at FROM shifts WHERE 1=1";
  const params: string[] = [];
  
  if (startDate) {
    query += " AND start_time >= ?";
    params.push(startDate);
  }
  
  if (endDate) {
    query += " AND end_time <= ?";
    params.push(endDate);
  }
  
  query += " ORDER BY start_time ASC";
  
  const stmt = db.prepare(query);
  const result = stmt.all(...params);
  
  const shifts: Shift[] = [];
  for (const row of result) {
    const r = row as Record<string, unknown>;
    shifts.push({
      id: r.id as number,
      user_id: r.user_id as number,
      start_time: r.start_time as string,
      end_time: r.end_time as string,
      description: r.description as string | null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
    });
  }
  
  return shifts;
}

export function getShiftById(shiftId: number): Shift | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT id, user_id, start_time, end_time, description, created_at, updated_at FROM shifts WHERE id = ?");
  const result = stmt.all(shiftId);
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0] as Record<string, unknown>;
  return {
    id: row.id as number,
    user_id: row.user_id as number,
    start_time: row.start_time as string,
    end_time: row.end_time as string,
    description: row.description as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function createShift(userId: number, startTime: string, endTime: string, description: string | null): Shift {
  const db = getDatabase();
  const stmt = db.prepare("INSERT INTO shifts (user_id, start_time, end_time, description) VALUES (?, ?, ?, ?)");
  stmt.run(userId, startTime, endTime, description);
  
  const lastId = db.lastInsertRowId;
  const shift = getShiftById(Number(lastId));
  if (!shift) {
    throw new Error("Failed to create shift");
  }
  return shift;
}

export function updateShift(shiftId: number, userId: number, startTime: string, endTime: string, description: string | null): Shift | null {
  const db = getDatabase();
  // Check ownership
  const shift = getShiftById(shiftId);
  if (!shift || shift.user_id !== userId) {
    return null;
  }
  
  const stmt = db.prepare("UPDATE shifts SET start_time = ?, end_time = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(startTime, endTime, description, shiftId);
  
  return getShiftById(shiftId);
}

export function deleteShift(shiftId: number, userId: number): boolean {
  const db = getDatabase();
  // Check ownership
  const shift = getShiftById(shiftId);
  if (!shift || shift.user_id !== userId) {
    return false;
  }
  
  const stmt = db.prepare("DELETE FROM shifts WHERE id = ?");
  stmt.run(shiftId);
  return true;
}

