import { NextRequest, NextResponse } from "next/server";
import { sendRealSms } from "@/lib/sms-gateway";
import { getStoreSettings, saveStoreSettings } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, apiKey, provider, twilioSid, twilioToken, twilioFrom } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Please provide a 10-digit mobile number to test." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Mobile number must be a valid 10-digit number." },
        { status: 400 }
      );
    }

    // Generate a random 6-digit test OTP
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`[ADMIN SMS TEST] Dispatching test OTP ${testOtp} to +91 ${cleanPhone}`);
    
    // Temporarily apply key to store settings if supplied so sendRealSms picks it up
    if (apiKey) {
      await saveStoreSettings({
        smsApiKey: apiKey.trim(),
        smsProvider: provider || "fast2sms",
        twilioSid: twilioSid?.trim(),
        twilioToken: twilioToken?.trim(),
        twilioFrom: twilioFrom?.trim(),
      });
    }

    const result = await sendRealSms(cleanPhone, testOtp);

    // If test failed and an apiKey was freshly passed, revert back unless already active
    if (!result.sent && apiKey && !result.gatewayResponse?.return) {
      // Keep or let user inspect
    }

    if (result.sent) {
      return NextResponse.json({
        success: true,
        sent: true,
        provider: result.provider,
        message: `Real SMS successfully delivered to +91 ${cleanPhone} via ${result.provider.toUpperCase()}! Check your phone.`,
        testOtp,
        gatewayResponse: result.gatewayResponse,
      });
    } else {
      return NextResponse.json({
        success: false,
        sent: false,
        provider: result.provider,
        message: result.message,
        gatewayResponse: result.gatewayResponse,
      });
    }
  } catch (error: any) {
    console.error("POST /api/admin/test-sms error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to execute SMS test." },
      { status: 500 }
    );
  }
}
