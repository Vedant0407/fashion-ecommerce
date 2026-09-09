import { NextRequest, NextResponse } from "next/server";
import { sendRealEmail } from "@/lib/email-gateway";
import { saveStoreSettings } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      provider,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
      brevoApiKey,
      resendApiKey,
      persist = true,
    } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address to test." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address format." },
        { status: 400 }
      );
    }

    // If credentials were provided with the test request and persist is requested, save them
    if (persist && (smtpUser || brevoApiKey || resendApiKey || provider)) {
      await saveStoreSettings({
        emailProvider: provider || "gmail",
        smtpHost: smtpHost?.trim(),
        smtpPort: smtpPort ? Number(smtpPort) : undefined,
        smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : undefined,
        smtpUser: smtpUser?.trim(),
        smtpPass: smtpPass?.trim(),
        smtpFrom: smtpFrom?.trim(),
        brevoApiKey: brevoApiKey?.trim(),
        resendApiKey: resendApiKey?.trim(),
      });
    }

    // Generate a random 6-digit test OTP
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`[ADMIN EMAIL TEST] Dispatching test OTP ${testOtp} to ${cleanEmail}`);

    const startTime = Date.now();
    const result = await sendRealEmail(cleanEmail, testOtp, "Store Administrator");
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.sent) {
      return NextResponse.json({
        success: true,
        sent: true,
        provider: result.provider,
        message: `Real verification email with passcode [${testOtp}] was successfully delivered to ${cleanEmail} via ${result.provider.toUpperCase()} in ${duration}s! Please check your inbox (and Spam folder).`,
        testOtp,
        duration: `${duration}s`,
        details: result.details,
      });
    } else {
      return NextResponse.json({
        success: false,
        sent: false,
        provider: result.provider,
        message: result.message || "Failed to dispatch email.",
        error: result.error,
        testOtp,
      });
    }
  } catch (error: any) {
    console.error("POST /api/admin/test-email error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to execute email test." },
      { status: 500 }
    );
  }
}
