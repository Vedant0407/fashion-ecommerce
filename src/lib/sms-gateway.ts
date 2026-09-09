import { getStoreSettings } from "./store-data";

export type SmsProvider = "fast2sms" | "2factor" | "twilio" | "msg91" | "none";

export interface SmsDispatchResult {
  sent: boolean;
  provider: SmsProvider;
  message: string;
  gatewayResponse?: any;
}

/**
 * Send a real SMS to a 10-digit Indian mobile number (+91) using configured carrier SMS gateways.
 * Supported providers:
 * 1. Fast2SMS (Free sign-up in India, instant OTP route without DLT)
 * 2. 2Factor.in (Indian carrier OTP route)
 * 3. Twilio (Global carrier SMS)
 */
export async function sendRealSms(
  phone10Digits: string,
  otpCode: string
): Promise<SmsDispatchResult> {
  const cleanPhone = phone10Digits.replace(/\D/g, "").slice(-10);

  // Check store settings first, then environment variables
  let fast2smsKey = process.env.FAST2SMS_API_KEY?.trim() || "";
  let twoFactorKey = process.env.TWO_FACTOR_API_KEY?.trim() || "";
  let twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  let twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  let twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim() || "";
  let preferredProvider: string = "fast2sms";

  try {
    const settings: any = await getStoreSettings();
    if (settings.smsProvider) {
      preferredProvider = settings.smsProvider;
    }
    if (settings.smsApiKey) {
      const key = settings.smsApiKey.trim();
      if (preferredProvider === "2factor") {
        twoFactorKey = key;
      } else if (preferredProvider === "fast2sms") {
        fast2smsKey = key;
      } else {
        fast2smsKey = key;
      }
    }
    if (settings.twilioSid && settings.twilioToken) {
      twilioSid = settings.twilioSid.trim();
      twilioToken = settings.twilioToken.trim();
      twilioFrom = settings.twilioFrom?.trim() || twilioFrom;
    }
  } catch (e) {
    // Ignore settings read error
  }

  // 1. If 2Factor is selected or available
  if (preferredProvider === "2factor" && twoFactorKey) {
    const result = await dispatch2Factor(twoFactorKey, cleanPhone, otpCode);
    if (result.sent) return result;
    if (result.gatewayResponse) return result;
  }

  // 2. If Twilio is selected or available
  if (preferredProvider === "twilio" && twilioSid && twilioToken && twilioFrom) {
    const result = await dispatchTwilio(twilioSid, twilioToken, twilioFrom, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // 3. Fast2SMS (Free & Instant in India - Recommended)
  if (fast2smsKey) {
    const result = await dispatchFast2Sms(fast2smsKey, cleanPhone, otpCode);
    if (result.sent) return result;
    // If it failed and returned an explicit gateway error, return it
    if (result.gatewayResponse) {
      return result;
    }
  }

  // Fallback checks if other keys exist
  if (twoFactorKey && preferredProvider !== "2factor") {
    const result = await dispatch2Factor(twoFactorKey, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  if (twilioSid && twilioToken && twilioFrom && preferredProvider !== "twilio") {
    const result = await dispatchTwilio(twilioSid, twilioToken, twilioFrom, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // No active gateway credentials found
  console.log(`\n======================================================`);
  console.log(`[REAL SMS GATEWAY NOTICE]`);
  console.log(`No active SMS Gateway key configured.`);
  console.log(`Mobile: +91 ${cleanPhone}`);
  console.log(`Generated OTP: ${otpCode}`);
  console.log(`To receive real SMS on your phone:`);
  console.log(`1. Visit https://www.fast2sms.com/ (free signup, takes 30s)`);
  console.log(`2. Copy your API Key and paste it into /admin -> Settings`);
  console.log(`   or in .env.local as FAST2SMS_API_KEY=...`);
  console.log(`======================================================\n`);

  return {
    sent: false,
    provider: "none",
    message: `Carrier SMS dispatch requires an SMS API key (Fast2SMS or Twilio). Please enter your key in /admin -> Settings or .env.local.`,
  };
}

async function dispatchFast2Sms(
  apiKey: string,
  cleanPhone: string,
  otpCode: string
): Promise<SmsDispatchResult> {
  try {
    // Attempt 1: Fast2SMS POST JSON (OTP route)
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variables_values: otpCode,
        route: "otp",
        numbers: cleanPhone,
      }),
    });

    const json = await response.json();

    if (json.return === true || json.status_code === 200) {
      console.log(`[REAL SMS DELIVERED via Fast2SMS] OTP sent to +91 ${cleanPhone}`);
      return {
        sent: true,
        provider: "fast2sms",
        message: `Real SMS delivered to +91 ${cleanPhone} via Fast2SMS carrier network.`,
        gatewayResponse: json,
      };
    }

    // Attempt 2: GET fallback if POST returned format error
    try {
      const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
        apiKey
      )}&route=otp&variables_values=${encodeURIComponent(otpCode)}&flash=0&numbers=${encodeURIComponent(
        cleanPhone
      )}`;
      const getRes = await fetch(getUrl);
      const getJson = await getRes.json();
      if (getJson.return === true || getJson.status_code === 200) {
        console.log(`[REAL SMS DELIVERED via Fast2SMS GET] OTP sent to +91 ${cleanPhone}`);
        return {
          sent: true,
          provider: "fast2sms",
          message: `Real SMS delivered to +91 ${cleanPhone} via Fast2SMS carrier network.`,
          gatewayResponse: getJson,
        };
      }
    } catch {
      // ignore GET fallback error
    }

    const errorMsg = Array.isArray(json.message)
      ? json.message.join(", ")
      : json.message || "Fast2SMS rejected request.";
    console.warn("[Fast2SMS Error]:", json);

    return {
      sent: false,
      provider: "fast2sms",
      message: `Fast2SMS Gateway returned: ${errorMsg}`,
      gatewayResponse: json,
    };
  } catch (err: any) {
    console.warn("Fast2SMS fetch error:", err.message);
    return {
      sent: false,
      provider: "fast2sms",
      message: `Fast2SMS network error: ${err.message}`,
    };
  }
}

async function dispatch2Factor(
  apiKey: string,
  cleanPhone: string,
  otpCode: string
): Promise<SmsDispatchResult> {
  try {
    const cleanKey = apiKey.trim();
    const url = `https://2factor.in/API/V1/${cleanKey}/SMS/+91${cleanPhone}/${otpCode}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.Status === "Success") {
      console.log(`[REAL SMS DELIVERED via 2Factor] OTP sent to +91 ${cleanPhone}`);
      return {
        sent: true,
        provider: "2factor",
        message: `Real SMS successfully delivered to +91 ${cleanPhone} via 2Factor.in cellular gateway!`,
        gatewayResponse: json,
      };
    }

    return {
      sent: false,
      provider: "2factor",
      message: `2Factor error: ${json.Details || "Failed to send"}`,
      gatewayResponse: json,
    };
  } catch (err: any) {
    return {
      sent: false,
      provider: "2factor",
      message: `2Factor network error: ${err.message}`,
    };
  }
}

async function dispatchTwilio(
  sid: string,
  token: string,
  from: string,
  cleanPhone: string,
  otpCode: string
): Promise<SmsDispatchResult> {
  try {
    const authHeader = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
    const body = new URLSearchParams({
      To: `+91${cleanPhone}`,
      From: from,
      Body: `Your GreenO verification code is: ${otpCode}. Valid for 10 minutes.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const json = await response.json();

    if (json.sid && !json.error_code) {
      console.log(`[REAL SMS DELIVERED via Twilio] OTP sent to +91 ${cleanPhone}`);
      return {
        sent: true,
        provider: "twilio",
        message: `Real SMS delivered to +91 ${cleanPhone} via Twilio.`,
        gatewayResponse: json,
      };
    }

    return {
      sent: false,
      provider: "twilio",
      message: `Twilio error: ${json.message || "Failed to send"}`,
      gatewayResponse: json,
    };
  } catch (err: any) {
    return {
      sent: false,
      provider: "twilio",
      message: `Twilio network error: ${err.message}`,
    };
  }
}
