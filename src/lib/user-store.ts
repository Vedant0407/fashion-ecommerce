import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
const OTP_STORE_FILE = path.join(DATA_DIR, "otp-store.json");


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

function loadUsersFromDisk(): void {
  try {
    let raw: string | null = null;

    if (fs.existsSync(USERS_FILE)) {
      raw = fs.readFileSync(USERS_FILE, "utf-8");
    } else if (fs.existsSync(TMP_USERS_FILE)) {
      raw = fs.readFileSync(TMP_USERS_FILE, "utf-8");
    }

    if (raw) {
      const list: UserRecord[] = JSON.parse(raw);
      list.forEach((user) => {
        if (user && user.email) {
          const norm = normalizeEmail(user.email);
          const existing = inMemoryUsersCache.get(norm);
          if (!existing || (!existing.passwordHash && user.passwordHash)) {
            inMemoryUsersCache.set(norm, user);
          }
        }
      });
    }

    // Ensure primary owner account exists
    const primaryOwnerEmail = "vedantshrivastava0407@gmail.com";
    if (!inMemoryUsersCache.has(primaryOwnerEmail)) {
      const now = new Date().toISOString();
      const ownerUser: UserRecord = {
        id: "usr_owner_vedant",
        name: "Vedant Shrivastava",
        email: primaryOwnerEmail,
        provider: "email",
        email_verified: true,
        created_at: now,
        updated_at: now,
        last_login_at: now,
      };
      inMemoryUsersCache.set(primaryOwnerEmail, ownerUser);
    }
  } catch (err) {
    console.warn("Could not load users from disk (using in-memory cache):", err);
  }
}

function saveUsersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const list = Array.from(inMemoryUsersCache.values());
    const jsonStr = JSON.stringify(list, null, 2);

    try {
      fs.writeFileSync(USERS_FILE, jsonStr, "utf-8");
    } catch (primaryErr) {
      console.warn("Could not write to primary USERS_FILE, falling back to TMP:", primaryErr);
    }

    try {
      fs.writeFileSync(TMP_USERS_FILE, jsonStr, "utf-8");
    } catch (tmpErr) {
      console.warn("Could not write to TMP_USERS_FILE:", tmpErr);
    }
  } catch (err) {
    console.error("Failed to persist users to disk:", err);
  }
}

function ensureInitialized(): void {
  if (!isInitialized) {
    loadUsersFromDisk();
    saveUsersToDisk();
    isInitialized = true;
  }
}

// ----------------- Verification / Known User Check -----------------

export async function isKnownVerifiedUser(email: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  if (!clean) return false;

  // 1. Primary site owner
  if (clean === "vedantshrivastava0407@gmail.com") {
    return true;
  }

  // 2. Check local memory or disk store
  ensureInitialized();
  if (inMemoryUsersCache.has(clean)) {
    return true;
  }

  // 3. Check OTP store (if user requested or verified an OTP)
  try {
    if (fs.existsSync(OTP_STORE_FILE)) {
      const raw = fs.readFileSync(OTP_STORE_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.some((item: any) => item.target?.toLowerCase() === clean)) {
        return true;
      }
    }
  } catch (err) {
    console.warn("Notice checking otp store for known user:", err);
  }

  return false;
}

// ----------------- User Management Functions -----------------

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (dbUser) {
      const record: UserRecord = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash || undefined,
        provider: dbUser.provider as "email" | "google",
        email_verified: dbUser.email_verified,
        created_at: dbUser.created_at.toISOString(),
        updated_at: dbUser.updated_at.toISOString(),
        last_login_at: dbUser.last_login_at ? dbUser.last_login_at.toISOString() : undefined,
      };
      inMemoryUsersCache.set(normalized, record);
      return record;
    }
  } catch (err) {
    // fallback to cache
  }

  ensureInitialized();
  loadUsersFromDisk();
  return inMemoryUsersCache.get(normalized) || null;
}

export async function createUser(params: {
  name: string;
  email: string;
  password?: string;
  provider?: "email" | "google";
  email_verified?: boolean;
}): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  ensureInitialized();
  loadUsersFromDisk();

  const normalized = normalizeEmail(params.email);
  if (!normalized) {
    return { success: false, message: "Valid email is required." };
  }

  if (inMemoryUsersCache.has(normalized)) {
    const existing = inMemoryUsersCache.get(normalized)!;
    if (params.password && !existing.passwordHash) {
      existing.passwordHash = hashPassword(params.password);
      existing.updated_at = new Date().toISOString();
      if (params.name) existing.name = params.name.trim();
      existing.email_verified = true;
      saveUsersToDisk();

      try {
        await prisma.user.update({
          where: { email: normalized },
          data: {
            passwordHash: existing.passwordHash,
            name: existing.name,
            email_verified: true,
          },
        });
      } catch {}

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
  saveUsersToDisk();

  try {
    await prisma.user.upsert({
      where: { email: normalized },
      update: {
        name: newUser.name,
        passwordHash: newUser.passwordHash || null,
        provider: newUser.provider,
        email_verified: newUser.email_verified,
        last_login_at: new Date(now),
      },
      create: {
        id: newUser.id,
        name: newUser.name,
        email: normalized,
        passwordHash: newUser.passwordHash || null,
        provider: newUser.provider,
        email_verified: newUser.email_verified,
        created_at: new Date(now),
        last_login_at: new Date(now),
      },
    });
  } catch (dbErr) {
    console.warn("Prisma user save notice:", dbErr);
  }

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
  ensureInitialized();
  loadUsersFromDisk();

  const normalized = normalizeEmail(email);
  const user = await getUserByEmail(normalized);

  if (!user || !user.email_verified || !user.passwordHash) {
    return {
      success: false,
      message: "Invalid email or password. Please use your verified account credentials.",
    };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return {
      success: false,
      message: "Invalid email or password. Please check your credentials.",
    };
  }

  user.last_login_at = new Date().toISOString();
  saveUsersToDisk();

  try {
    await prisma.user.update({
      where: { email: normalized },
      data: { last_login_at: new Date() },
    });
  } catch {}

  return {
    success: true,
    user: toSafeUser(user),
    message: "Login successful.",
  };
}
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  ensureInitialized();
  loadUsersFromDisk();

  const normalized = normalizeEmail(email);
  let user = inMemoryUsersCache.get(normalized);

  const now = new Date().toISOString();
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    user.updated_at = now;
    user.last_login_at = now;
    user.email_verified = true;
  } else {
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name:
        normalized === "vedantshrivastava0407@gmail.com"
          ? "Vedant Shrivastava"
          : normalized.split("@")[0],
      email: normalized,
      passwordHash: hashPassword(newPassword),
      provider: "email",
      email_verified: true,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    };
    inMemoryUsersCache.set(normalized, user);
  }

  saveUsersToDisk();

  try {
    await prisma.user.upsert({
      where: { email: normalized },
      update: {
        passwordHash: user.passwordHash || null,
        email_verified: true,
        last_login_at: new Date(now),
      },
      create: {
        id: user.id,
        name: user.name,
        email: normalized,
        passwordHash: user.passwordHash || null,
        provider: user.provider,
        email_verified: true,
        created_at: new Date(now),
        last_login_at: new Date(now),
      },
    });
  } catch (err) {
    console.warn("Prisma resetUserPassword notice:", err);
  }

  return {
    success: true,
    user: toSafeUser(user),
    message: "Password reset successfully. You are now logged in.",
  };
}

export async function registerOrUpdateGoogleUser(
  email: string,
  name?: string
): Promise<SafeUser> {
  ensureInitialized();
  loadUsersFromDisk();

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

  saveUsersToDisk();

  try {
    await prisma.user.upsert({
      where: { email: normalized },
      update: {
        name: user.name,
        email_verified: true,
        last_login_at: new Date(now),
      },
      create: {
        id: user.id,
        name: user.name,
        email: normalized,
        provider: "google",
        email_verified: true,
        created_at: new Date(now),
        last_login_at: new Date(now),
      },
    });
  } catch (err) {
    console.warn("Prisma registerOrUpdateGoogleUser notice:", err);
  }

  return toSafeUser(user);
}

export async function updateUserLastLogin(email: string): Promise<void> {
  ensureInitialized();
  loadUsersFromDisk();
  const normalized = normalizeEmail(email);
  const user = inMemoryUsersCache.get(normalized);
  if (user) {
    user.last_login_at = new Date().toISOString();
    saveUsersToDisk();

    try {
      await prisma.user.update({
        where: { email: normalized },
        data: { last_login_at: new Date() },
      });
    } catch {}
  }
}

export async function getAllSafeUsers(): Promise<SafeUser[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
    });
    if (dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider as "email" | "google",
        email_verified: u.email_verified,
        created_at: u.created_at.toISOString(),
        updated_at: u.updated_at.toISOString(),
        last_login_at: u.last_login_at ? u.last_login_at.toISOString() : undefined,
      }));
    }
  } catch (err) {
    console.warn("Prisma user fetch notice, falling back to cache:", err);
  }

  ensureInitialized();
  loadUsersFromDisk();
  return Array.from(inMemoryUsersCache.values())
    .map(toSafeUser)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTotalUsersCount(): Promise<number> {
  try {
    const count = await prisma.user.count();
    if (count > 0) return count;
  } catch {}

  ensureInitialized();
  loadUsersFromDisk();
  return inMemoryUsersCache.size;
}
