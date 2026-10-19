import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, message: "Client order synchronization is disabled. Orders are saved securely during checkout." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
