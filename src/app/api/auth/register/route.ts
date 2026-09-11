import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { createUser, normalizeEmail } from "@/lib/user-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, code } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    // 2. Verify 6-digit OTP code
    let otpValid = false;

    // Check Supabase OTP token first if present
    try {
      const supabase = await createClient();
      const { data: sbData, error: sbError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "email",
      });
      if (!sbError && sbData?.user) {
        otpValid = true;
      }
    } catch {
      // Supabase verify check fallback
    }

    // Check our local OTP store
    if (!otpValid) {
      const localCheck = await verifyOtp(cleanEmail, cleanCode, "email");
      if (localCheck.success) {
        otpValid = true;
      }
    }

    if (!otpValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code. Please check your email or request a new code.",
        },
        { status: 400 }
      );
    }

    // 3. Persist user into our permanent server database
    const createResult = await createUser({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      provider: "email",
      email_verified: true,
    });

    if (!createResult.success || !createResult.user) {
      return NextResponse.json(
        {
          success: false,
          message: createResult.message || "Failed to create account.",
        },
        { status: 400 }
      );
    }

    // 4. Background sync with Supabase Auth
    try {
      const supabase = await createClient();
      await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
          },
        },
      });
    } catch (sbErr) {
      console.warn("Background Supabase signUp notice:", sbErr);
    }

    // 5. Build response and attach session cookie
    const response = NextResponse.json({
      success: true,
      user: createResult.user,
      message: "Account created and verified successfully. Welcome to GreenO!",
    });

    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
