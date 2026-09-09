import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-data";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({
      success: true,
      announcementText: settings.announcementText,
      storeNotice: settings.storeNotice,
      supportPhone: settings.supportPhone,
      supportEmail: settings.supportEmail,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      announcementText: "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE",
    });
  }
}
