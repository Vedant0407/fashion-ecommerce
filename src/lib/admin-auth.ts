import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, syncUserProfile } from "@/lib/user-store";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data.user;
    if (error || !user?.email) {
      return NextResponse.json({ success: false, message: "Please sign in with an administrator account." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (!profile || profile.role !== "admin") await syncUserProfile(user);
    const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (refreshed?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    return null;
  } catch (error) {
    console.error("Admin authorization failed:", error);
    return NextResponse.json({ success: false, message: "Admin access is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function getAdminSession() {
  const denied = await requireAdmin();
  if (denied) return { response: denied };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}
