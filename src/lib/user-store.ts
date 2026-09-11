import fs from "fs";
import path from "path";
import crypto from "crypto";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string; // stored as "salt:hash"
  provider: "email" | "google";
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
};

export type SafeUser = Omit<UserRecord, "passwordHash">;

const DATA_DIR = path.join(process.cwd(), "src", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TMP_USERS_FILE = path.join(
  typeof process !== "undefined" && process.platform === "win32"
    ? DATA_DIR
    : "/tmp",
  "greeno-users-cache.json"
);

// In-memory cache for fast lookups
let inMemoryUsersCache: Map<string, UserRecord> = new Map();
let isInitialized = false;

// ----------------- Password Hashing Helpers -----------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error("verifyPassword error:", err);
    return false;
  }
}

export function toSafeUser(user: UserRecord): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ----------------- Disk Persistence -----------------

async function loadUsersFromDisk(): Promise<void> {
  try {
    let raw: string | null = null;

    if (fs.existsSync(USERS_FILE)) {
      raw = await fs.promises.readFile(USERS_FILE, "utf-8");
    } else if (fs.existsSync(TMP_USERS_FILE)) {
      raw = await fs.promises.readFile(TMP_USERS_FILE, "utf-8");
    }

    if (raw) {
      const list: UserRecord[] = JSON.parse(raw);
      list.forEach((user) => {
        if (user && user.email) {
          inMemoryUsersCache.set(normalizeEmail(user.email), user);
        }
      });
    }
  } catch (err) {
    console.warn("Could not load users from disk (using in-memory cache):", err);
  }
}

async function saveUsersToDisk(): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }

    const list = Array.from(inMemoryUsersCache.values());
    const jsonStr = JSON.stringify(list, null, 2);

    try {
      await fs.promises.writeFile(USERS_FILE, jsonStr, "utf-8");
    } catch (primaryErr) {
      console.warn("Could not write to primary USERS_FILE, falling back to TMP:", primaryErr);
      await fs.promises.writeFile(TMP_USERS_FILE, jsonStr, "utf-8");
    }
  } catch (err) {
    console.error("Failed to persist users to disk:", err);
  }
}

async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await loadUsersFromDisk();
    isInitialized = true;
  }
}

// ----------------- User Management Functions -----------------

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureInitialized();
  const normalized = normalizeEmail(email);
  return inMemoryUsersCache.get(normalized) || null;
}

export async function createUser(params: {
  name: string;
  email: string;
  password?: string;
  provider?: "email" | "google";
  email_verified?: boolean;
}): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  await ensureInitialized();

  const normalized = normalizeEmail(params.email);
  if (!normalized) {
    return { success: false, message: "Valid email is required." };
  }

  if (inMemoryUsersCache.has(normalized)) {
    const existing = inMemoryUsersCache.get(normalized)!;
    // If user previously signed in with google and is now setting a password
    if (params.password && !existing.passwordHash) {
      existing.passwordHash = hashPassword(params.password);
      existing.updated_at = new Date().toISOString();
      if (params.name) existing.name = params.name.trim();
      existing.email_verified = true;
      await saveUsersToDisk();
      return { success: true, user: toSafeUser(existing), message: "Account password updated." };
    }

    return {
      success: false,
      message: "An account with this email already exists. Please log in instead.",
    };
  }

  const now = new Date().toISOString();
  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name: (params.name || normalized.split("@")[0]).trim(),
    email: normalized,
    passwordHash: params.password ? hashPassword(params.password) : undefined,
    provider: params.provider || "email",
    email_verified: params.email_verified ?? true,
    created_at: now,
    updated_at: now,
    last_login_at: now,
  };

  inMemoryUsersCache.set(normalized, newUser);
  await saveUsersToDisk();

  console.log(`[USER STORE] Created user: ${newUser.email} (ID: ${newUser.id})`);

  return {
    success: true,
    user: toSafeUser(newUser),
    message: "User account created successfully.",
  };
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  await ensureInitialized();

  const normalized = normalizeEmail(email);
  const user = inMemoryUsersCache.get(normalized);

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password. If you don't have an account yet, please sign up.",
    };
  }

  if (!user.passwordHash) {
    if (user.provider === "google") {
      return {
        success: false,
        message: "This account was created with Google Sign-In. Please click 'Sign in with Google'.",
      };
    }
    return {
      success: false,
      message: "Invalid login credentials. Please reset your password or sign up.",
    };
  }

  const isMatch = verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    return {
      success: false,
      message: "Invalid email or password. Please check your credentials.",
    };
  }

  // Update last login timestamp
  user.last_login_at = new Date().toISOString();
  await saveUsersToDisk();

  return {
    success: true,
    user: toSafeUser(user),
    message: "Login successful.",
  };
}

export async function registerOrUpdateGoogleUser(
  email: string,
  name?: string
): Promise<SafeUser> {
  await ensureInitialized();

  const normalized = normalizeEmail(email);
  const now = new Date().toISOString();

  let user = inMemoryUsersCache.get(normalized);

  if (user) {
    user.last_login_at = now;
    if (name && (!user.name || user.name === user.email.split("@")[0])) {
      user.name = name.trim();
    }
    user.email_verified = true;
  } else {
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: (name || normalized.split("@")[0]).trim(),
      email: normalized,
      provider: "google",
      email_verified: true,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    };
    inMemoryUsersCache.set(normalized, user);
  }

  await saveUsersToDisk();
  return toSafeUser(user);
}

export async function updateUserLastLogin(email: string): Promise<void> {
  await ensureInitialized();
  const normalized = normalizeEmail(email);
  const user = inMemoryUsersCache.get(normalized);
  if (user) {
    user.last_login_at = new Date().toISOString();
    await saveUsersToDisk();
  }
}

export async function getAllSafeUsers(): Promise<SafeUser[]> {
  await ensureInitialized();
  return Array.from(inMemoryUsersCache.values())
    .map(toSafeUser)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTotalUsersCount(): Promise<number> {
  await ensureInitialized();
  return inMemoryUsersCache.size;
}
