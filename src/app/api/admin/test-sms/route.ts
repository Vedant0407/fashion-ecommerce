import { randomInt } from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sendRealSms } from "@/lib/sms-gateway";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(-10) : "";
    if (phone.length !== 10) return NextResponse.json({ success: false, message: "Enter a valid 10-digit phone number." }, { status: 400 });
    const result = await sendRealSms(phone, randomInt(100000, 1000000).toString());
    if (!result.sent) return NextResponse.json({ success: false, sent: false, message: "SMS test failed. Check the server SMS settings." }, { status: 503 });
    return NextResponse.json({ success: true, sent: true, provider: result.provider, message: "Test SMS sent to the destination phone." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/admin/test-sms failed.");
    return NextResponse.json({ success: false, message: "SMS test failed." }, { status: 503 });
  }
}
