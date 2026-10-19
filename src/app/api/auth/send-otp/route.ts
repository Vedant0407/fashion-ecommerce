import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.target === "string" ? body.target.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    }
    if (body.type !== "signup") {
      return NextResponse.json({ success: false, message: "Request a password reset from the reset-password form." }, { status: 400 });
    }

    const supabase = await createClient();
    const redirectTo = new URL("/auth/callback?next=%2Faccount", request.url).toString();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      console.error("Supabase signup OTP resend rejected:", {
        code: error.code,
        status: error.status,
        message: error.message.replaceAll(email, "[redacted email]"),
      });
      return NextResponse.json(
        { success: false, message: "We could not resend the verification code. Wait a moment and try again." },
        { status: error.status && error.status >= 500 ? 503 : 429 }
      );
    }

    return NextResponse.json(
      { success: true, message: "A new verification code was sent to your email." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/send-otp error:", error);
    return NextResponse.json(
      { success: false, message: "We could not send the verification code right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
