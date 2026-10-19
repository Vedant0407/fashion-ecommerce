import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential =
      typeof body.credential === "string" ? body.credential.trim() : "";

    if (!credential) {
      return NextResponse.json(
        { success: false, message: "A verified Google credential is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "Google authentication failed." },
        { status: 401 }
      );
    }

    const profile = await syncUserProfile(data.user);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/google error:", error);
    return NextResponse.json(
      { success: false, message: "Google authentication is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
