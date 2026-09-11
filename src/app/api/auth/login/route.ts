import { NextRequest, NextResponse } from "next/server";
import {
  verifyUserCredentials,
  normalizeEmail,
  getUserByEmail,
  createUser,
  toSafeUser,
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

    // 1. Check permanent database user store
    const localUser = await getUserByEmail(cleanEmail);

    if (localUser) {
      const verifyResult = await verifyUserCredentials(cleanEmail, password);

      if (!verifyResult.success || !verifyResult.user) {
        return NextResponse.json(
          {
            success: false,
            message: verifyResult.message || "Invalid email or password.",
          },
          { status: 401 }
        );
      }

      // Login successful from local store
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

    // 2. Fallback: User not yet in local store — check Supabase Auth and auto-migrate
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
      console.warn("Supabase auth fallback attempt notice:", sbErr);
    }

    // 3. User not found in either database
    return NextResponse.json(
      {
        success: false,
        message: "Invalid email or password. If you don't have an account yet, please sign up.",
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
