import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp-store";
import { sendRealEmail } from "@/lib/email-gateway";
import { normalizeEmail, isKnownVerifiedUser } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if user exists or is known
    const isKnown = await isKnownVerifiedUser(cleanEmail);
    if (!isKnown) {
      return NextResponse.json(
        {
          success: false,
          message: "No account found with this email address. Please sign up first.",
        },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const { code, expiresAt } = await generateOtp(cleanEmail, "email");

    // Dispatch via real Gmail SMTP email gateway
    let realEmailSent = false;
    let emailMessage = "";
    try {
      const emailResult = await sendRealEmail(cleanEmail, code);
      realEmailSent = emailResult.sent;
      emailMessage = emailResult.message;
    } catch (err: any) {
      console.warn("Failed to dispatch password reset code via email gateway:", err);
      emailMessage = err.message || "Failed to dispatch email.";
    }

    console.log(`[PASSWORD RESET OTP] Dispatched code ${code} to ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: realEmailSent
        ? `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox and Spam folder.`
        : `Verification code generated for ${cleanEmail}.`,
      expiresAt,
      realEmailSent,
      emailMessage,
    });
  } catch (error: any) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
