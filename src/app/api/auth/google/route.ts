import { NextRequest, NextResponse } from "next/server";
import { registerOrUpdateGoogleUser, normalizeEmail } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, name } = body;

    // If a Google Identity Services JWT credential is provided, decode it
    if (body.credential && typeof body.credential === "string") {
      try {
        const parts = body.credential.split(".");
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          if (payload.email) {
            email = payload.email;
            name = payload.name || name || payload.email.split("@")[0];
          }
        }
      } catch (jwtErr) {
        console.warn("Could not decode Google JWT credential:", jwtErr);
      }
    }

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
