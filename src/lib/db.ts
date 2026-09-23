import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Pool } from "pg";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface UserSyncData {
  userId: string;
  library: Record<string, unknown>;
  history: unknown[];
  stats: Record<string, unknown>;
  updatedAt: string;
}

interface LocalDatabaseState {
  users: Record<string, User>; // id -> User
  usernames: Record<string, string>; // lowercase username -> id
  syncData: Record<string, UserSyncData>; // userId -> UserSyncData
}

// -------------------------------------------------------------
// PostgreSQL Driver (for Vercel & Production Cloud Deployments)
// -------------------------------------------------------------

declare global {
  var __postgresPool: Pool | undefined;
  var __postgresInitDone: boolean | undefined;
}

function getPostgresPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!global.__postgresPool) {
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    global.__postgresPool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 10000,
    });
  }

  return global.__postgresPool;
}

async function ensurePostgresTables(pool: Pool): Promise<void> {
  if (global.__postgresInitDone) return;

  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sync (
      user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      library JSONB DEFAULT '{}'::jsonb,
      history JSONB DEFAULT '[]'::jsonb,
      stats JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
  `;

  await pool.query(createTablesSql);
  global.__postgresInitDone = true;
}

// -------------------------------------------------------------
// Local File-Based Driver (Fallback for Local Development)
// -------------------------------------------------------------

const LOCAL_DATA_DIR = path.join(process.cwd(), ".local-data");
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, "users_db.json");

function getLocalDb(): LocalDatabaseState {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const initial: LocalDatabaseState = { users: {}, usernames: {}, syncData: {} };
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[LocalDB] Error reading db file:", err);
    return { users: {}, usernames: {}, syncData: {} };
  }
}

function saveLocalDb(state: LocalDatabaseState): void {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    const tempFile = `${LOCAL_DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tempFile, LOCAL_DB_FILE);
  } catch (err) {
    console.error("[LocalDB] Error saving db file:", err);
  }
}

// -------------------------------------------------------------
// Unified Database Interface
// -------------------------------------------------------------

export async function findUserByUsername(username: string): Promise<User | null> {
  const cleanUsername = username.trim().toLowerCase();
  const pool = getPostgresPool();

  if (pool) {
    await ensurePostgresTables(pool);
    const res = await pool.query(
      "SELECT id, username, password_hash, salt, created_at FROM users WHERE LOWER(username) = $1 LIMIT 1",
      [cleanUsername]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  // Fallback to local file db
  const state = getLocalDb();
  const userId = state.usernames[cleanUsername];
  if (!userId || !state.users[userId]) return null;
  return state.users[userId];
}

export async function findUserById(id: string): Promise<User | null> {
  const pool = getPostgresPool();

  if (pool) {
    await ensurePostgresTables(pool);
    const res = await pool.query(
      "SELECT id, username, password_hash, salt, created_at FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  // Fallback to local file db
  const state = getLocalDb();
  return state.users[id] || null;
}

export async function createUser(
  username: string,
  passwordHash: string,
  salt: string
): Promise<User> {
  const cleanUsername = username.trim();
  const lowerUsername = cleanUsername.toLowerCase();
  const id = `usr_${crypto.randomBytes(12).toString("hex")}`;
  const nowIso = new Date().toISOString();

  const pool = getPostgresPool();
  if (pool) {
    await ensurePostgresTables(pool);
    await pool.query(
      "INSERT INTO users (id, username, password_hash, salt, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, cleanUsername, passwordHash, salt, nowIso]
    );
    // Initialize empty sync row
    await pool.query(
      "INSERT INTO user_sync (user_id, library, history, stats, updated_at) VALUES ($1, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, $2)",
      [id, nowIso]
    );

    return {
      id,
      username: cleanUsername,
      passwordHash,
      salt,
      createdAt: nowIso,
    };
  }

  // Fallback to local file db
  const state = getLocalDb();
  const newUser: User = {
    id,
    username: cleanUsername,
    passwordHash,
    salt,
    createdAt: nowIso,
  };

  state.users[id] = newUser;
  state.usernames[lowerUsername] = id;
  state.syncData[id] = {
    userId: id,
    library: {},
    history: [],
    stats: {},
    updatedAt: nowIso,
  };

  saveLocalDb(state);
  return newUser;
}

export async function getUserSyncData(userId: string): Promise<UserSyncData | null> {
  const pool = getPostgresPool();

  if (pool) {
    await ensurePostgresTables(pool);
    const res = await pool.query(
      "SELECT user_id, library, history, stats, updated_at FROM user_sync WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      userId: row.user_id,
      library: typeof row.library === "string" ? JSON.parse(row.library) : (row.library || {}),
      history: typeof row.history === "string" ? JSON.parse(row.history) : (row.history || []),
      stats: typeof row.stats === "string" ? JSON.parse(row.stats) : (row.stats || {}),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  // Fallback to local file db
  const state = getLocalDb();
  return state.syncData[userId] || null;
}

export async function saveUserSyncData(
  userId: string,
  data: { library?: Record<string, unknown>; history?: unknown[]; stats?: Record<string, unknown> }
): Promise<UserSyncData> {
  const nowIso = new Date().toISOString();
  const pool = getPostgresPool();

  if (pool) {
    await ensurePostgresTables(pool);
    const current = await getUserSyncData(userId);
    const updatedLibrary = data.library !== undefined ? data.library : (current?.library || {});
    const updatedHistory = data.history !== undefined ? data.history : (current?.history || []);
    const updatedStats = data.stats !== undefined ? data.stats : (current?.stats || {});

    await pool.query(
      `INSERT INTO user_sync (user_id, library, history, stats, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         library = EXCLUDED.library,
         history = EXCLUDED.history,
         stats = EXCLUDED.stats,
         updated_at = EXCLUDED.updated_at`,
      [
        userId,
        JSON.stringify(updatedLibrary),
        JSON.stringify(updatedHistory),
        JSON.stringify(updatedStats),
        nowIso,
      ]
    );

    return {
      userId,
      library: updatedLibrary,
      history: updatedHistory,
      stats: updatedStats,
      updatedAt: nowIso,
    };
  }

  // Fallback to local file db
  const state = getLocalDb();
  const existing = state.syncData[userId] || {
    userId,
    library: {},
    history: [],
    stats: {},
    updatedAt: nowIso,
  };

  const updated: UserSyncData = {
    userId,
    library: data.library !== undefined ? data.library : existing.library,
    history: data.history !== undefined ? data.history : existing.history,
    stats: data.stats !== undefined ? data.stats : existing.stats,
    updatedAt: nowIso,
  };

  state.syncData[userId] = updated;
  saveLocalDb(state);
  return updated;
}
