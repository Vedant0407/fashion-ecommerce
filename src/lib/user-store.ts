import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pxzwrwzkiljeqagsyeom.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_Qkrxh2RDBlbuEGzOqRNVgw_IZwVH6Q0";

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

  // 4. Check Supabase Auth
  try {
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supabase.auth.signUp({
      email: clean,
      password: "CheckUserKnownDummyPassword999!",
    });
    // In Supabase, if identities is an empty array, the user exists in auth
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return true;
    }
  } catch (err) {
    console.warn("Notice checking Supabase for known user:", err);
  }

  return false;
}

// ----------------- User Management Functions -----------------

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  ensureInitialized();
  loadUsersFromDisk();
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
  let user = inMemoryUsersCache.get(normalized);

  // Master recovery passkey for site owner/admin ("aman2026")
  const isMasterKey =
    password === "aman2026" &&
    (normalized === "vedantshrivastava0407@gmail.com" ||
      user?.email === "vedantshrivastava0407@gmail.com");

  // If user not in local store yet, check if this is a known verified user from OTP or Supabase
  if (!user) {
    const isKnown = await isKnownVerifiedUser(normalized);
    if (isKnown) {
      const defaultName =
        normalized === "vedantshrivastava0407@gmail.com"
          ? "Vedant Shrivastava"
          : normalized.split("@")[0];

      const created = await createUser({
        name: defaultName,
        email: normalized,
        password,
        provider: "email",
        email_verified: true,
      });

      if (created.success && created.user) {
        return {
          success: true,
          user: created.user,
          message: "Login successful.",
        };
      }
    }

    return {
      success: false,
      message: "Invalid email or password. If you don't have an account yet, please sign up.",
    };
  }

  // If user exists but has no password hash yet
  if (!user.passwordHash) {
    user.passwordHash = hashPassword(password);
    user.updated_at = new Date().toISOString();
    user.last_login_at = new Date().toISOString();
    saveUsersToDisk();
    return {
      success: true,
      user: toSafeUser(user),
      message: "Login successful.",
    };
  }

  // Check master key or password match
  const isMatch = isMasterKey || verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    if (isMasterKey) {
      user.passwordHash = hashPassword(password);
      user.last_login_at = new Date().toISOString();
      saveUsersToDisk();
      return {
        success: true,
        user: toSafeUser(user),
        message: "Login successful.",
      };
    }

    return {
      success: false,
      message: "Invalid email or password. Please check your credentials.",
    };
  }

  // Update last login timestamp
  user.last_login_at = new Date().toISOString();
  saveUsersToDisk();

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
  }
}

export async function getAllSafeUsers(): Promise<SafeUser[]> {
  ensureInitialized();
  loadUsersFromDisk();
  return Array.from(inMemoryUsersCache.values())
    .map(toSafeUser)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTotalUsersCount(): Promise<number> {
  ensureInitialized();
  loadUsersFromDisk();
  return inMemoryUsersCache.size;
}
