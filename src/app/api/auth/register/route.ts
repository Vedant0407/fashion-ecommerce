import { NextRequest, NextResponse } from "next/server";
import { createUser, normalizeEmail } from "@/lib/user-store";
import {
  EMAIL_OTP_COOKIE,
  emailOtpCookieOptions,
  verifyEmailOtpChallenge,
} from "@/lib/email-otp-cookie";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, code } = body;

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

    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
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
    if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json(
        { success: false, message: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const verification = await verifyEmailOtpChallenge(
      request.cookies.get(EMAIL_OTP_COOKIE)?.value,
      cleanEmail,
      code
    );
    if (!verification.success) {
      const response = NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
      if (verification.updatedToken && verification.expiresAt) {
        response.cookies.set(
          EMAIL_OTP_COOKIE,
          verification.updatedToken,
          emailOtpCookieOptions(verification.expiresAt)
        );
      } else if (verification.clearCookie) {
        response.cookies.set(EMAIL_OTP_COOKIE, "", emailOtpCookieOptions());
      }
      return response;
    }

    const createResult = await createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      provider: "email",
      email_verified: true,
    });
    if (!createResult.success || !createResult.user) {
      return NextResponse.json(
        { success: false, message: createResult.message || "Failed to create account." },
        { status: 400 }
      );
    }

    try {
      const supabase = await createClient();
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: name.trim(), name: name.trim() } },
      });
    } catch (error) {
      console.warn("Supabase sign-up sync notice:", error);
    }

    const response = NextResponse.json({
      success: true,
      user: createResult.user,
      message: "Account created and verified successfully. Welcome to GreenO!",
    });
    response.cookies.set(EMAIL_OTP_COOKIE, "", emailOtpCookieOptions());
    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });
    return response;
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}