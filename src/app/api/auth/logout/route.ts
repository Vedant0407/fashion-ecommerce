import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    // Delete session cookie
    response.cookies.delete("greeno_session");

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to log out." },
      { status: 500 }
    );
  }
}
