import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Client-side return synchronization is disabled. Requests are saved by the authenticated server." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
