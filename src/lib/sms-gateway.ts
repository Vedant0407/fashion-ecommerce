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

  const fast2smsKey = process.env.FAST2SMS_API_KEY?.trim() || "";
  const twoFactorKey = process.env.TWO_FACTOR_API_KEY?.trim() || "";
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim() || "";
  const preferredProvider = process.env.SMS_PROVIDER || "none";
  // 1. If 2Factor is selected or available
  if (twoFactorKey && (preferredProvider === "2factor" || !fast2smsKey)) {
    const result = await dispatch2Factor(twoFactorKey, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // 2. Fast2SMS (if configured)
  if (fast2smsKey) {
    const result = await dispatchFast2Sms(fast2smsKey, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // 3. Twilio (if configured)
  if (twilioSid && twilioToken && twilioFrom) {
    const result = await dispatchTwilio(twilioSid, twilioToken, twilioFrom, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // 4. Secondary fallback to 2Factor if not previously successful
  if (twoFactorKey) {
    const result = await dispatch2Factor(twoFactorKey, cleanPhone, otpCode);
    if (result.sent) return result;
  }

  // No active gateway credentials found
  return {
    sent: false,
    provider: "none",
    message: `SMS delivery is not configured on the server. Add a supported SMS provider to the server environment.`,
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
