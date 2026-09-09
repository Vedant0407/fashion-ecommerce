import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, saveStoreSettings } from "@/lib/store-data";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await saveStoreSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
