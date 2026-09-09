import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp-store";
import { createClient } from "@/lib/supabase/server";
import { sendRealSms } from "@/lib/sms-gateway";

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(target.trim())) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid email address." },
          { status: 400 }
        );
      }
    } else if (type === "phone") {
      const digits = target.replace(/\D/g, "");
      if (digits.length < 10) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid 10-digit mobile number." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid verification type. Expected 'email' or 'phone'." },
        { status: 400 }
      );
    }

    // 1. Generate security OTP in our local store
    const { code, expiresAt } = await generateOtp(target, type, name);

    // 2. If it's an email, dispatch a REAL email using Supabase Auth
    let realEmailSent = false;
    if (type === "email") {
      try {
        const supabase = await createClient();
        const { error: sbEmailError } = await supabase.auth.signInWithOtp({
          email: target.trim(),
          options: {
            data: {
              full_name: name || undefined,
            },
          },
        });

        if (sbEmailError) {
          console.warn("Supabase real email notice:", sbEmailError.message);
        } else {
          realEmailSent = true;
          console.log(`[REAL EMAIL DISPATCHED] An actual email with the login code was sent to ${target.trim()} via Supabase!`);
        }
      } catch (emailErr) {
        console.warn("Failed to dispatch via Supabase email server:", emailErr);
      }
    }

    // 3. If it's a phone, attempt to dispatch a REAL SMS using the SMS Gateway
    let realSmsSent = false;
    let smsProvider = "none";
    let smsMessage = "";
    if (type === "phone") {
      const smsResult = await sendRealSms(target, code);
      realSmsSent = smsResult.sent;
      smsProvider = smsResult.provider;
      smsMessage = smsResult.message;
    }

    console.log(`\n========================================`);
    console.log(`[GREENO SECURITY GATEWAY - OTP DISPATCH]`);
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`Recipient: ${target}`);
    if (name) console.log(`Name: ${name}`);
    console.log(`>>> 6-DIGIT VERIFICATION CODE: ${code} <<<`);
    if (type === "email") {
      console.log(`Real Email Sent: ${realEmailSent ? "YES (Check Gmail / Spam folder)" : "NO"}`);
    } else {
      console.log(`Real SMS Sent: ${realSmsSent ? `YES via ${smsProvider.toUpperCase()}` : "Awaiting Gateway API Key"}`);
    }
    console.log(`Expires in: 10 minutes`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      message:
        type === "email"
          ? realEmailSent
            ? `Verification code dispatched to ${target}. Please check your Gmail / email inbox.`
            : `A verification code for ${target} has been generated.`
          : realSmsSent
          ? `Real SMS verification code dispatched to your mobile +91 ${target.replace(/\D/g, "").slice(-10)}. Please check your SMS Messages app!`
          : `Carrier SMS API key not configured. Code for +91 ${target.replace(/\D/g, "").slice(-10)} is ${code}.`,
      code: (type === "phone" && realSmsSent) || (type === "email" && realEmailSent) ? undefined : code,
      realEmailSent,
      realSmsSent,
      smsProvider,
      smsMessage,
      type,
      target,
      expiresAt,
    });
  } catch (error: any) {
    console.error("POST /api/auth/send-otp error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to dispatch verification code." },
      { status: 500 }
    );
  }
}
