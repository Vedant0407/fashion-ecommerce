import nodemailer from "nodemailer";
import { getStoreSettings } from "./store-data";
import { createClient } from "./supabase/server";

export type EmailProvider = "gmail" | "smtp" | "brevo" | "resend" | "supabase" | "none";

export interface EmailDispatchResult {
  sent: boolean;
  provider: EmailProvider;
  message: string;
  error?: string;
  details?: any;
}

/**
 * Generate a responsive brutalist HTML email for GreenO 6-digit OTP verification.
 */
function buildBrandedEmailHtml(otpCode: string, recipientName?: string): string {
  const name = recipientName ? recipientName.trim() : "Valued Member";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GreenO Security Verification Passcode</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
    .container { max-width: 540px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; padding: 40px 32px; }
    .header { border-bottom: 2px solid #ffffff; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff; margin: 0; }
    .subbrand { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; margin-top: 6px; }
    .title { font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; margin-bottom: 12px; }
    .text { font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px; }
    .code-box { background-color: #1a1a1a; border: 1px solid #333333; padding: 24px; text-align: center; margin: 28px 0; }
    .code { font-size: 36px; font-weight: 900; letter-spacing: 0.35em; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 0; }
    .code-hint { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #888888; margin-top: 10px; }
    .security-note { font-size: 11px; color: #777777; line-height: 1.5; border-top: 1px solid #222222; padding-top: 20px; margin-top: 30px; }
    .footer { text-align: center; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #555555; margin-top: 30px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d;">
  <div class="container" style="max-width: 540px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; padding: 40px 32px;">
    <div class="header" style="border-bottom: 2px solid #ffffff; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 class="brand" style="font-size: 20px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff; margin: 0;">GREENO</h1>
      <div class="subbrand" style="font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; margin-top: 6px;">OFF-DUTY ATELIER &bull; SECURITY GATEWAY</div>
    </div>

    <div class="title" style="font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; margin-bottom: 12px;">SECURITY VERIFICATION PASSCODE</div>

    <p class="text" style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px;">
      Hello ${name},<br />
      We received a request to verify your identity for your GreenO account. Enter the 6-digit security passcode below to complete authentication:
    </p>

    <div class="code-box" style="background-color: #1a1a1a; border: 1px solid #333333; padding: 24px; text-align: center; margin: 28px 0;">
      <div class="code" style="font-size: 36px; font-weight: 900; letter-spacing: 0.35em; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 0;">
        ${otpCode}
      </div>
      <div class="code-hint" style="font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #888888; margin-top: 10px;">
        EXPIRES IN 10 MINUTES &bull; ONE-TIME USE ONLY
      </div>
    </div>

    <p class="text" style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-bottom: 24px;">
      If you did not request this verification code, please ignore this email. Your GreenO account remains fully secure.
    </p>

    <div class="security-note" style="font-size: 11px; color: #777777; line-height: 1.5; border-top: 1px solid #222222; padding-top: 20px; margin-top: 30px;">
      <strong>Security Notice:</strong> GreenO representatives will never ask you for your passcode or password via phone call, SMS, or social media.
    </div>

    <div class="footer" style="text-align: center; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #555555; margin-top: 30px;">
      &copy; ${new Date().getFullYear()} GREENO CLOTHING CO. ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatch real verification email with 6-digit OTP code to recipient's email address.
 */
export async function sendRealEmail(
  targetEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<EmailDispatchResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();

  // Load configured store settings
  let settings: any = {};
  try {
    settings = await getStoreSettings();
  } catch (e) {
    // Ignore store read error
  }

  // Determine credentials from Store Settings or Environment Variables
  const preferredProvider: string =
    settings.emailProvider || process.env.EMAIL_PROVIDER || "gmail";

  // SMTP Settings
  const smtpHost =
    settings.smtpHost ||
    process.env.SMTP_HOST ||
    (preferredProvider === "gmail" ? "smtp.gmail.com" : "");

  const smtpPort =
    Number(settings.smtpPort || process.env.SMTP_PORT) ||
    (preferredProvider === "gmail" ? 465 : 587);

  const smtpSecure =
    settings.smtpSecure !== undefined
      ? Boolean(settings.smtpSecure)
      : smtpPort === 465;

  const smtpUser = settings.smtpUser || process.env.SMTP_USER || "";
  const smtpPass = settings.smtpPass || process.env.SMTP_PASS || "";
  const smtpFrom =
    settings.smtpFrom ||
    process.env.SMTP_FROM ||
    (smtpUser ? `GreenO Security <${smtpUser}>` : "GreenO Security <concierge@greeno.in>");

  // Brevo API Key
  const brevoApiKey = settings.brevoApiKey || process.env.BREVO_API_KEY || "";

  // Resend API Key
  const resendApiKey = settings.resendApiKey || process.env.RESEND_API_KEY || "";

  // 1. Try Brevo REST API if configured
  if (brevoApiKey && (preferredProvider === "brevo" || (!smtpUser && !resendApiKey))) {
    const brevoResult = await dispatchBrevoApi(brevoApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (brevoResult.sent) return brevoResult;
  }

  // 2. Try Resend REST API if configured
  if (resendApiKey && (preferredProvider === "resend" || (!smtpUser && !brevoApiKey))) {
    const resendResult = await dispatchResendApi(resendApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (resendResult.sent) return resendResult;
  }

  // 3. Try SMTP / Gmail if credentials exist
  if (smtpHost && smtpUser && smtpPass) {
    const smtpResult = await dispatchNodemailerSmtp(
      {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      },
      cleanEmail,
      otpCode,
      recipientName
    );
    if (smtpResult.sent) return smtpResult;
  }

  // 4. Secondary fallback: Brevo if available
  if (brevoApiKey) {
    const brevoResult = await dispatchBrevoApi(brevoApiKey, cleanEmail, otpCode, recipientName, smtpFrom);
    if (brevoResult.sent) return brevoResult;
  }

  // 5. Tertiary fallback: Supabase signInWithOtp
  const supabaseResult = await dispatchSupabaseOtp(cleanEmail, recipientName);
  if (supabaseResult.sent) {
    return supabaseResult;
  }

  console.log(`\n======================================================`);
  console.log(`[REAL EMAIL GATEWAY NOTICE]`);
  console.log(`No active Email SMTP or API Key configured.`);
  console.log(`Recipient: ${cleanEmail}`);
  console.log(`Generated OTP: ${otpCode}`);
  console.log(`To receive real emails in your Gmail / inbox:`);
  console.log(`1. Enter your Gmail & App Password in /admin -> Settings`);
  console.log(`   or in .env.local as SMTP_USER=... and SMTP_PASS=...`);
  console.log(`2. Or enter a free Brevo / Resend API key.`);
  console.log(`======================================================\n`);

  return {
    sent: false,
    provider: "none",
    message:
      supabaseResult.error?.includes("rate limit")
        ? "Supabase shared email pool is currently rate-limited. Use the emergency passcode shown on screen or configure Gmail SMTP in /admin."
        : "Email SMTP not yet configured. Please configure in /admin -> EMAIL GATEWAY or use the on-screen passcode.",
    error: supabaseResult.error,
  };
}

/**
 * Dispatch email via Nodemailer SMTP (Gmail, Brevo SMTP, Outlook, Custom SMTP).
 */
async function dispatchNodemailerSmtp(
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  },
  toEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<EmailDispatchResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security passcode is: ${otpCode}. Valid for 10 minutes.`;

    const info = await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: `GreenO Security Passcode: [${otpCode}]`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[REAL EMAIL DELIVERED via SMTP] Sent to ${toEmail}. Message ID: ${info.messageId}`);

    return {
      sent: true,
      provider: config.host.includes("gmail") ? "gmail" : "smtp",
      message: `Real verification email with passcode delivered to ${toEmail} via SMTP!`,
      details: { messageId: info.messageId },
    };
  } catch (err: any) {
    console.warn("[SMTP Dispatch Error]:", err.message);
    return {
      sent: false,
      provider: "smtp",
      message: `SMTP Error: ${err.message}`,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Brevo (Sendinblue) REST API.
 * Free tier provides 300 emails/day without credit card.
 */
async function dispatchBrevoApi(
  apiKey: string,
  toEmail: string,
  otpCode: string,
  recipientName?: string,
  fromHeader?: string
): Promise<EmailDispatchResult> {
  try {
    let fromEmail = "noreply@greeno.in";
    let fromName = "GreenO Security";

    if (fromHeader && fromHeader.includes("<")) {
      const match = fromHeader.match(/^(.*)<(.*)>$/);
      if (match) {
        fromName = match[1].trim() || fromName;
        fromEmail = match[2].trim() || fromEmail;
      }
    }

    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security passcode is: ${otpCode}. Valid for 10 minutes.`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail, name: recipientName || toEmail }],
        subject: `GreenO Security Passcode: [${otpCode}]`,
        htmlContent,
        textContent,
      }),
    });

    const json = await res.json();

    if (res.ok && json.messageId) {
      console.log(`[REAL EMAIL DELIVERED via Brevo] Sent to ${toEmail}. ID: ${json.messageId}`);
      return {
        sent: true,
        provider: "brevo",
        message: `Real verification email delivered to ${toEmail} via Brevo!`,
        details: json,
      };
    }

    return {
      sent: false,
      provider: "brevo",
      message: `Brevo API returned: ${json.message || JSON.stringify(json)}`,
      error: json.message,
    };
  } catch (err: any) {
    console.warn("[Brevo API Error]:", err.message);
    return {
      sent: false,
      provider: "brevo",
      message: `Brevo network error: ${err.message}`,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Resend REST API.
 */
async function dispatchResendApi(
  apiKey: string,
  toEmail: string,
  otpCode: string,
  recipientName?: string,
  fromHeader?: string
): Promise<EmailDispatchResult> {
  try {
    const fromAddress = fromHeader || "GreenO Security <onboarding@resend.dev>";
    const htmlContent = buildBrandedEmailHtml(otpCode, recipientName);
    const textContent = `Your GreenO security passcode is: ${otpCode}. Valid for 10 minutes.`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: `GreenO Security Passcode: [${otpCode}]`,
        html: htmlContent,
        text: textContent,
      }),
    });

    const json = await res.json();

    if (res.ok && json.id) {
      console.log(`[REAL EMAIL DELIVERED via Resend] Sent to ${toEmail}. ID: ${json.id}`);
      return {
        sent: true,
        provider: "resend",
        message: `Real verification email delivered to ${toEmail} via Resend!`,
        details: json,
      };
    }

    return {
      sent: false,
      provider: "resend",
      message: `Resend API returned: ${json.message || JSON.stringify(json)}`,
      error: json.message,
    };
  } catch (err: any) {
    console.warn("[Resend API Error]:", err.message);
    return {
      sent: false,
      provider: "resend",
      message: `Resend network error: ${err.message}`,
      error: err.message,
    };
  }
}

/**
 * Fallback to Supabase built-in signInWithOtp.
 */
async function dispatchSupabaseOtp(
  toEmail: string,
  recipientName?: string
): Promise<EmailDispatchResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: toEmail,
      options: {
        data: {
          full_name: recipientName || undefined,
        },
      },
    });

    if (error) {
      console.warn("Supabase signInWithOtp notice:", error.message);
      return {
        sent: false,
        provider: "supabase",
        message: error.message,
        error: error.message,
      };
    }

    return {
      sent: true,
      provider: "supabase",
      message: `Verification link dispatched via Supabase to ${toEmail}.`,
    };
  } catch (err: any) {
    return {
      sent: false,
      provider: "supabase",
      message: err.message,
      error: err.message,
    };
  }
}
