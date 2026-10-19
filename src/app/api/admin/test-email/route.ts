import { randomInt } from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sendRealEmail } from "@/lib/email-gateway";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    const result = await sendRealEmail(email, randomInt(100000, 1000000).toString(), "Store Administrator");
    if (!result.sent) return NextResponse.json({ success: false, sent: false, message: "Email test failed. Check the server email settings." }, { status: 503 });
    return NextResponse.json({ success: true, sent: true, provider: result.provider, message: "Test email sent. Check the destination inbox." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/admin/test-email failed.");
    return NextResponse.json({ success: false, message: "Email test failed." }, { status: 503 });
  }
}
