import { NextRequest, NextResponse } from "next/server";
import { registerOrUpdateGoogleUser, normalizeEmail } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Valid email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);
    const safeUser = await registerOrUpdateGoogleUser(cleanEmail, name);

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: "Google authentication recorded.",
    });

    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/google error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process Google sign in." },
      { status: 500 }
    );
  }
}
