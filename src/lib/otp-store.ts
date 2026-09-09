import fs from "fs";
import path from "path";

export type OtpRecord = {
  target: string; // email address or phone number
  type: "email" | "phone";
  code: string;
  name?: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
};

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_STORE_DIR = path.join(process.cwd(), "src", "data");
const OTP_STORE_FILE = path.join(OTP_STORE_DIR, "otp-store.json");

// In-memory cache with file persistence fallback
let inMemoryOtpCache: Map<string, OtpRecord> = new Map();

function normalizeTarget(target: string, type: "email" | "phone"): string {
  if (type === "email") {
    return target.trim().toLowerCase();
  }
  // Strip non-numeric characters for phone numbers
  const digits = target.replace(/\D/g, "");
  // If 12 digits starting with 91, keep 10-digit base
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

async function loadOtpStore(): Promise<void> {
  try {
    if (fs.existsSync(OTP_STORE_FILE)) {
      const raw = await fs.promises.readFile(OTP_STORE_FILE, "utf-8");
      const list: OtpRecord[] = JSON.parse(raw);
      const now = Date.now();
      inMemoryOtpCache.clear();
      list.forEach((item) => {
        if (item.expiresAt > now) {
          inMemoryOtpCache.set(`${item.type}:${item.target}`, item);
        }
      });
    }
  } catch (err) {
    console.error("Error reading otp-store.json:", err);
  }
}

async function saveOtpStore(): Promise<void> {
  try {
    if (!fs.existsSync(OTP_STORE_DIR)) {
      await fs.promises.mkdir(OTP_STORE_DIR, { recursive: true });
    }
    const list = Array.from(inMemoryOtpCache.values()).filter(
      (item) => item.expiresAt > Date.now()
    );
    await fs.promises.writeFile(OTP_STORE_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing otp-store.json:", err);
  }
}

export async function generateOtp(
  rawTarget: string,
  type: "email" | "phone",
  name?: string
): Promise<{ code: string; expiresAt: number }> {
  await loadOtpStore();

  const target = normalizeTarget(rawTarget, type);
  // Generate 6-digit numeric string
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  const record: OtpRecord = {
    target,
    type,
    code,
    name: name?.trim(),
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false,
  };

  inMemoryOtpCache.set(`${type}:${target}`, record);
  await saveOtpStore();

  return { code, expiresAt };
}

export async function verifyOtp(
  rawTarget: string,
  code: string,
  type: "email" | "phone"
): Promise<{ success: boolean; message: string; name?: string }> {
  await loadOtpStore();

  const target = normalizeTarget(rawTarget, type);
  const key = `${type}:${target}`;
  const record = inMemoryOtpCache.get(key);

  if (!record) {
    return {
      success: false,
      message: "No verification code was requested for this target or it has expired.",
    };
  }

  if (Date.now() > record.expiresAt) {
    inMemoryOtpCache.delete(key);
    await saveOtpStore();
    return {
      success: false,
      message: "Verification code has expired. Please request a new one.",
    };
  }

  if (record.attempts >= 5) {
    inMemoryOtpCache.delete(key);
    await saveOtpStore();
    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    await saveOtpStore();
    return {
      success: false,
      message: `Invalid verification code. Attempts remaining: ${5 - record.attempts}.`,
    };
  }

  record.verified = true;
  await saveOtpStore();

  return {
    success: true,
    message: "Verification successful.",
    name: record.name,
  };
}

export async function isTargetVerified(
  rawTarget: string,
  type: "email" | "phone"
): Promise<boolean> {
  await loadOtpStore();
  const target = normalizeTarget(rawTarget, type);
  const record = inMemoryOtpCache.get(`${type}:${target}`);
  return Boolean(record && record.verified && record.expiresAt > Date.now());
}
