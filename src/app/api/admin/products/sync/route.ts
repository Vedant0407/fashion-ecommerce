import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ success: false, message: "Client product synchronization is disabled. Products are managed in the admin console." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
