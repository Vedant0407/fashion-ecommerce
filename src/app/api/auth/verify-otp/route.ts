import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, code, type = "email" } = body;

    if (!target || !code) {
      return NextResponse.json(
        { success: false, message: "Target (email/phone) and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let verified = false;
    let verifiedName: string | undefined;

    // 1. If email, attempt verification with Supabase's real email token first
    if (type === "email") {
      try {
        const supabase = await createClient();
        const { data: sbData, error: sbError } = await supabase.auth.verifyOtp({
          email: target.trim(),
          token: cleanCode,
          type: "email",
        });

        if (!sbError && sbData?.user) {
          verified = true;
          verifiedName =
            sbData.user.user_metadata?.full_name ||
            sbData.user.user_metadata?.name;
        }
      } catch (sbErr) {
        console.warn("Supabase verifyOtp check notice:", sbErr);
      }
    }

    // 2. If not yet verified by Supabase (or if phone), verify with our OTP store
    if (!verified) {
      const localResult = await verifyOtp(target, cleanCode, type);
      if (localResult.success) {
        verified = true;
        verifiedName = localResult.name;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code. Please check your email or request a new code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Verification successful.",
      name: verifiedName,
    });
  } catch (error: any) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
