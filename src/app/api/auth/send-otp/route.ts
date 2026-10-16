import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp-store";
import { sendRealEmail } from "@/lib/email-gateway";
import { sendRealSms } from "@/lib/sms-gateway";
import {
  createEmailOtpChallenge,
  EMAIL_OTP_COOKIE,
  emailOtpCookieOptions,
} from "@/lib/email-otp-cookie";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, type = "email", name } = body;

    if (!target || typeof target !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid email address or phone number is required." },
        { status: 400 }
      );
    }

    if (type === "email") {
      const email = target.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid email address." },
          { status: 400 }
        );
      }

      const challenge = createEmailOtpChallenge(email, name);
      const result = await sendRealEmail(email, challenge.code, name);
      if (!result.sent) {
        return NextResponse.json(
          { success: false, message: "We couldn't send the verification email. Please try again shortly." },
          { status: 503 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${email}.`,
        expiresAt: challenge.expiresAt,
        realEmailSent: true,
        emailProvider: result.provider,
      });
      response.cookies.set(
        EMAIL_OTP_COOKIE,
        challenge.token,
        emailOtpCookieOptions(challenge.expiresAt)
      );
      return response;
    }

    if (type !== "phone") {
      return NextResponse.json(
        { success: false, message: "Invalid verification type. Expected 'email' or 'phone'." },
        { status: 400 }
      );
    }

    const digits = target.replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const { code, expiresAt } = await generateOtp(target, "phone", name);
    const smsResult = await sendRealSms(target, code);

    return NextResponse.json({
      success: true,
      message: smsResult.sent
        ? `A verification code has been sent to +91 ${digits.slice(-10)}.`
        : `Carrier SMS is not configured. Code for +91 ${digits.slice(-10)} is ${code}.`,
      code,
      expiresAt,
      realSmsSent: smsResult.sent,
      smsProvider: smsResult.provider,
      smsMessage: smsResult.message,
      type,
      target,
    });
  } catch (error: any) {
    console.error("POST /api/auth/send-otp error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}