import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, syncUserProfile } from "@/lib/user-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ success: false, message: "Enter your full name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Use a password with at least 8 characters." }, { status: 400 });
    }

    const supabase = await createClient();
    const confirmationRedirect = new URL("/auth/callback?next=%2Faccount", request.url).toString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, name },
        emailRedirectTo: confirmationRedirect,
      },
    });

    if (error || !data.user) {
      if (error) {
        console.error("Supabase signup rejected:", {
          code: error.code,
          status: error.status,
          message: error.message.replaceAll(email, "[redacted email]"),
        });
      } else {
        console.error("Supabase signup returned no user:", {
          hasSession: Boolean(data.session),
        });
      }
      const alreadyExists =
        error?.code === "user_already_exists" ||
        error?.code === "email_exists" ||
        /already registered/i.test(error?.message || "");
      return NextResponse.json(
        {
          success: false,
          message: alreadyExists
            ? "An account with this email already exists. Log in or reset its password."
            : "We could not create your account. Please try again.",
        },
        { status: alreadyExists ? 409 : 503 }
      );
    }

    // Supabase intentionally returns an obfuscated user for an existing, confirmed
    // email when confirmations are enabled. It has no identities, and no new
    // confirmation email is sent. Don't tell the customer to wait for a code.
    if (!data.session && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This email may already be registered. Log in or reset the password; if signup is still pending, the login screen can request a fresh code.",
        },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (data.session) {
      const profile = await syncUserProfile(data.user);
      return NextResponse.json(
        { success: true, requiresEmailConfirmation: false, user: profile },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        requiresEmailConfirmation: true,
        user: { id: data.user.id, email, name },
        message: "We sent a 6-digit Supabase verification code to your email.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
