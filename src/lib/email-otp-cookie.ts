import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { getStoreSettings } from "@/lib/store-data";

export const EMAIL_OTP_COOKIE = "greeno_email_otp";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type OtpPayload = {
  version: 1;
  email: string;
  name?: string;
  nonce: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

async function getSigningSecret(): Promise<string> {
  const environmentSecret =
    process.env.OTP_SECRET ||
    process.env.SMTP_PASS ||
    process.env.RESEND_API_KEY ||
    process.env.BREVO_API_KEY;
  if (environmentSecret) return environmentSecret;

  let settings: Awaited<ReturnType<typeof getStoreSettings>> | undefined;
  try {
    settings = await getStoreSettings();
  } catch {
    // Report a safe configuration error below if the store is unavailable too.
  }

  const secret = settings?.smtpPass || settings?.resendApiKey || settings?.brevoApiKey;
  if (!secret) throw new Error("Email OTP signing secret is not configured.");
  return secret;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function codeDigest(email: string, code: string, nonce: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${email}\0${nonce}\0${code}`)
    .digest("hex");
}

function encodePayload(payload: OtpPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

function decodePayload(token: string, secret: string): OtpPayload | null {
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;

  const expectedSignature = sign(encoded, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      payload?.version !== 1 ||
      typeof payload.email !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.codeHash !== "string" ||
      !Number.isFinite(payload.expiresAt) ||
      !Number.isInteger(payload.attempts)
    ) {
      return null;
    }
    return payload as OtpPayload;
  } catch {
    return null;
  }
}

export async function createEmailOtpChallenge(
  rawEmail: string,
  name?: string
): Promise<{ code: string; token: string; expiresAt: number }> {
  const secret = await getSigningSecret();
  const email = rawEmail.trim().toLowerCase();
  const code = randomInt(100000, 1000000).toString();
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  const payload: OtpPayload = {
    version: 1,
    email,
    name: name?.trim().slice(0, 120) || undefined,
    nonce,
    codeHash: codeDigest(email, code, nonce, secret),
    expiresAt,
    attempts: 0,
  };

  return { code, token: encodePayload(payload, secret), expiresAt };
}

export async function verifyEmailOtpChallenge(
  token: string | undefined,
  rawEmail: string,
  rawCode: string
): Promise<{
  success: boolean;
  message: string;
  updatedToken?: string;
  expiresAt?: number;
  clearCookie?: boolean;
  name?: string;
}> {
  if (!token) {
    return {
      success: false,
      message: "Verification expired. Please request a new code.",
      clearCookie: true,
    };
  }

  let secret: string;
  try {
    secret = await getSigningSecret();
  } catch {
    return {
      success: false,
      message: "Verification is temporarily unavailable. Please request a new code.",
      clearCookie: true,
    };
  }

  const payload = decodePayload(token, secret);
  if (!payload) {
    return {
      success: false,
      message: "Invalid or expired verification code. Please request a new one.",
      clearCookie: true,
    };
  }

  const email = rawEmail.trim().toLowerCase();
  if (payload.email !== email) {
    return {
      success: false,
      message: "This code was sent to a different email address. Request a new code.",
      clearCookie: true,
    };
  }

  if (payload.expiresAt <= Date.now()) {
    return {
      success: false,
      message: "Verification code has expired. Please request a new one.",
      clearCookie: true,
    };
  }

  if (payload.attempts >= MAX_ATTEMPTS) {
    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new code.",
      clearCookie: true,
    };
  }

  const code = rawCode.trim();
  const actualHash = codeDigest(email, code, payload.nonce, secret);
  const supplied = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(payload.codeHash, "hex");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    payload.attempts += 1;
    if (payload.attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
        clearCookie: true,
      };
    }

    return {
      success: false,
      message: `Invalid verification code. ${MAX_ATTEMPTS - payload.attempts} attempts remaining.`,
      updatedToken: encodePayload(payload, secret),
      expiresAt: payload.expiresAt,
    };
  }

  return { success: true, message: "Verification successful.", name: payload.name };
}

export function emailOtpCookieOptions(expiresAt?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: expiresAt
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      : 0,
  };
}
