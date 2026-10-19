import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, syncUserProfile } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Enter your email and password." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const emailNotConfirmed = error?.code === "email_not_confirmed";
      const unavailable = Boolean(error?.status && error.status >= 500);
      return NextResponse.json(
        {
          success: false,
          emailNotConfirmed,
          message: emailNotConfirmed
            ? "Verify your email before logging in. You can request a fresh code."
            : unavailable
              ? "Authentication is temporarily unavailable. Please try again."
              : "Invalid email or password.",
        },
        { status: emailNotConfirmed ? 403 : unavailable ? 503 : 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const profile = await syncUserProfile(data.user);
    return NextResponse.json(
      {
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          email_verified: profile.email_verified,
          provider: profile.provider,
        },
        message: "Login successful.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
