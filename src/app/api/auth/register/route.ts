import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/user-store";
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

    const supabase = await createClient();
    const confirmationRedirect = new URL(
      "/auth/callback?next=%2Faccount",
      request.url
    ).toString();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: name.trim(), name: name.trim() },
        emailRedirectTo: confirmationRedirect,
      },
    });

    if (error) {
      const alreadyExists =
        error.code === "user_already_exists" ||
        error.code === "email_exists" ||
        /already registered/i.test(error.message);
      return NextResponse.json(
        {
          success: false,
          message: alreadyExists
            ? "An account with this email already exists. Log in or use Forgot Password."
            : "Supabase could not create your account. Please try again.",
        },
        { status: alreadyExists ? 409 : 502 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "Supabase did not create the account. Please try again." },
        { status: 502 }
      );
    }

    if (!data.session) {
      const response = NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        user: {
          id: data.user.id,
          email: cleanEmail,
          name: data.user.user_metadata?.full_name || name.trim(),
        },
        message:
          "Your GreenO code is verified. Supabase also requires email confirmation, so check your inbox and open its confirmation link before logging in.",
      });
      response.cookies.set(EMAIL_OTP_COOKIE, "", emailOtpCookieOptions());
      return response;
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: cleanEmail,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            name.trim(),
          email_verified: Boolean(data.user.email_confirmed_at || data.user.confirmed_at),
          provider: data.user.app_metadata?.provider || "email",
        },
        message: "Account created and signed in successfully.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    response.cookies.set(EMAIL_OTP_COOKIE, "", emailOtpCookieOptions());
    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
