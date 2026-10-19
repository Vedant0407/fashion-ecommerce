import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, message: "Enter a valid email and the 6-digit reset code." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: "Use a password with at least 8 characters." }, { status: 400 });
    }

    const supabase = await createClient();
    const verified = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
    if (verified.error || !verified.data.user) {
      return NextResponse.json(
        { success: false, message: "That reset code is invalid or expired. Request a new one." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "We could not update your password. Request a fresh reset code and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
        },
        message: "Password updated successfully.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: "Password reset is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
