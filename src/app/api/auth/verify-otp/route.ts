import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.code === "string" ? body.code.trim() : "";
    const type = body.type === "recovery" ? "recovery" : "signup";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { success: false, message: "Enter the email address and all 6 digits from the latest email." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "That code is invalid or expired. Request a new code and try again." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user =
      type === "signup"
        ? await syncUserProfile(data.user)
        : {
            id: data.user.id,
            email: data.user.email,
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "",
          };

    return NextResponse.json(
      { success: true, verified: true, user, message: "Email verified successfully." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      { success: false, message: "Verification is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
