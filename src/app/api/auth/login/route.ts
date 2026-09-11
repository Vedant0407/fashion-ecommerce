import { NextRequest, NextResponse } from "next/server";
import {
  verifyUserCredentials,
  normalizeEmail,
  createUser,
} from "@/lib/user-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Both email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);

    // 1. Primary verification through our permanent database user store
    // Handles existing users, verified users from OTP, owner passkey ("aman2026"), and newly claimed credentials
    const verifyResult = await verifyUserCredentials(cleanEmail, password);

    if (verifyResult.success && verifyResult.user) {
      const response = NextResponse.json({
        success: true,
        user: verifyResult.user,
        message: "Login successful.",
      });

      response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        httpOnly: false,
      });

      return response;
    }

    // 2. Fallback: Check Supabase Auth directly (in case user was created outside our flow)
    try {
      const supabase = await createClient();
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!sbError && sbData?.user) {
        const fullName =
          sbData.user.user_metadata?.full_name ||
          sbData.user.user_metadata?.name ||
          cleanEmail.split("@")[0];

        // Auto-migrate user into permanent database store
        const migrated = await createUser({
          name: fullName,
          email: cleanEmail,
          password: password,
          provider: "email",
          email_verified: true,
        });

        const safeUser = migrated.user || {
          id: sbData.user.id,
          name: fullName,
          email: cleanEmail,
          provider: "email",
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const response = NextResponse.json({
          success: true,
          user: safeUser,
          message: "Login successful.",
        });

        response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          httpOnly: false,
        });

        return response;
      }
    } catch (sbErr) {
      console.warn("Supabase auth fallback notice:", sbErr);
    }

    // 3. User verification failed
    return NextResponse.json(
      {
        success: false,
        message:
          verifyResult.message ||
          "Invalid email or password. If you don't have an account yet, please sign up.",
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to log in. Please try again." },
      { status: 500 }
    );
  }
}
