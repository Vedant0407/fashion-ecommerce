import { prisma } from "@/lib/prisma";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  provider: string;
  email_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
};

export type SafeUser = UserRecord;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  return configured.includes(normalizeEmail(email));
}

function toUserRecord(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  provider: string;
  email_verified: boolean;
  role: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    provider: user.provider,
    email_verified: user.email_verified,
    role: user.role,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    last_login_at: user.last_login_at?.toISOString(),
  };
}

/** Supabase Auth owns credentials. This table stores only the commerce profile. */
export async function syncUserProfile(authUser: {
  id: string;
  email?: string;
  phone?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): Promise<SafeUser> {
  const email = normalizeEmail(authUser.email || "");
  if (!email) throw new Error("Supabase user email is missing.");
  const metadataName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim().slice(0, 120)
    : email.split("@")[0];
  const provider = typeof authUser.app_metadata?.provider === "string"
    ? authUser.app_metadata.provider
    : "email";
  const verified = Boolean(authUser.email_confirmed_at || authUser.confirmed_at);

  const profile = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      name,
      email,
      phone: authUser.phone || null,
      provider,
      email_verified: verified,
      role: isAdminEmail(email) ? "admin" : "customer",
      last_login_at: new Date(),
    },
    update: {
      email,
      provider,
      email_verified: verified,
      last_login_at: new Date(),
      role: isAdminEmail(email) ? "admin" : "customer",
    },
  });
  return toUserRecord(profile);
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const profile = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  return profile ? toUserRecord(profile) : null;
}

export async function getAllSafeUsers(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({ orderBy: { created_at: "desc" } });
  return users.map(toUserRecord);
}

export async function getTotalUsersCount(): Promise<number> {
  return prisma.user.count();
}
