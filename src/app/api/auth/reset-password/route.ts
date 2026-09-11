import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { normalizeEmail, resetUserPassword } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    // Verify OTP code
    const otpResult = await verifyOtp(cleanEmail, cleanCode, "email");
    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, message: otpResult.message || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Update password in permanent database store
    const resetResult = await resetUserPassword(cleanEmail, newPassword);
    if (!resetResult.success) {
      return NextResponse.json(
        { success: false, message: resetResult.message || "Failed to update password." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: resetResult.user,
      message: "Password updated successfully! Welcome back to GreenO.",
    });

    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
